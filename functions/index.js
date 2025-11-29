const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onValueWritten } = require("firebase-functions/v2/database");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Set Region to Asia
setGlobalOptions({ region: "asia-southeast1" });

// --- HELPER: Get Formatted Time with Offset ---
function getTimeWithOffset(date, offsetMinutes) {
  const targetTime = new Date(date.getTime() + offsetMinutes * 60000);
  let hours = targetTime.getHours();
  let minutes = targetTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const pad = (num) => num < 10 ? '0'+num : num;
  
  // Return standard format "8:05 AM"
  return `${hours}:${pad(minutes)} ${ampm}`;
}

// --- HELPER: Sanitize Time String ---
// Removes all spaces (including invisible ones) for safe comparison
// " 8:05  PM " -> "8:05PM"
function cleanTime(timeStr) {
    if (!timeStr) return "";
    return timeStr.replace(/[^a-zA-Z0-9:]/g, "").toUpperCase();
}

function getCurrentDay(date) {
  const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[date.getDay()];
}

// --- PART 1: SCHEDULER ---
exports.checkMedicationSchedule = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Manila",
}, async (event) => {
    
    const now = new Date();
    const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const currentDay = getCurrentDay(manilaTime);

    // Calculate Clean Targets
    const rawUpcoming = getTimeWithOffset(manilaTime, 3); // T+3
    const rawOpen     = getTimeWithOffset(manilaTime, 1); // T+1 (Hardware Open)
    const rawClose    = getTimeWithOffset(manilaTime, -1); // T-1 (Hardware Close)
    const rawMissed   = getTimeWithOffset(manilaTime, -10); // T-10

    const targetUpcoming = cleanTime(rawUpcoming);
    const targetOpen     = cleanTime(rawOpen);
    const targetClose    = cleanTime(rawClose);
    const targetMissed   = cleanTime(rawMissed);

    console.log(`CHECKING: ${currentDay} | Open Target: ${rawOpen}`);

    const db = admin.firestore();
    const rtdb = admin.database(); 
    
    const medboxesSnapshot = await db.collection('medboxes').get();
    const batch = db.batch();
    let notificationsSent = 0;

    for (const doc of medboxesSnapshot.docs) {
      const userId = doc.id;
      const compartments = doc.data();

      for (const key of Object.keys(compartments)) {
        const med = compartments[key];
        
        // Sanitize Database Time
        const dbTimeClean = cleanTime(med.time);

        if (!med.medName || !med.days.includes(currentDay) || !dbTimeClean) continue;

        // Skip if already taken (isEmpty is true)
        const isTaken = med.isEmpty === true;

        // 1. UPCOMING (T-3)
        if (dbTimeClean === targetUpcoming && !isTaken) {
          const ref = db.collection('activity_log').doc();
          batch.set(ref, {
            userId: userId, type: 'warning', title: 'Upcoming Medication',
            message: `Prepare to take ${med.medName} in 3 minutes.`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: key
          });
          notificationsSent++;
        }

        // 2. OPEN SIGNAL (T-1) -> Hardware OPEN
        else if (dbTimeClean === targetOpen && !isTaken) {
          console.log(`🟢 OPEN SIGNAL: ${userId} -> ${med.medName}`);
          
          const ref = db.collection('activity_log').doc();
          batch.set(ref, {
            userId: userId, type: 'success', title: 'Time to take Medicine',
            message: `Please take ${med.medName}. Box Opening...`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: key
          });

          try {
            const userDoc = await db.collection('users').doc(userId).get();
            const deviceId = userDoc.data().deviceId;
            if (deviceId && deviceId !== 'Not Connected') {
               await rtdb.ref(`devices/${deviceId}/compartments/${key}`).update({ isOpen: true });
            }
          } catch (err) { console.error("HW Open failed", err); }
          
          notificationsSent++;
        }

        // 3. CLOSE SIGNAL (T+1) -> Hardware CLOSE
        else if (dbTimeClean === targetClose) {
          console.log(`🔒 CLOSE SIGNAL: ${userId} -> ${med.medName}`);
          try {
            const userDoc = await db.collection('users').doc(userId).get();
            const deviceId = userDoc.data().deviceId;
            if (deviceId && deviceId !== 'Not Connected') {
               await rtdb.ref(`devices/${deviceId}/compartments/${key}`).update({ isOpen: false });
            }
          } catch (err) { console.error("HW Close failed", err); }
        }

        // 4. MISSED (T+10)
        else if (dbTimeClean === targetMissed && !isTaken) {
             const ref = db.collection('activity_log').doc();
             batch.set(ref, {
               userId: userId, type: 'alert', title: 'Missed Dose Alert',
               message: `You missed your ${med.time} dose!`,
               timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: key
             });
             notificationsSent++;
        }
      }
    }

    if (notificationsSent > 0) await batch.commit();
    return null;
});

// --- PART 2: HARDWARE BUTTON SYNC ---
exports.syncHardwareButton = onValueWritten(
  {
    ref: "/devices/{deviceId}/compartments/{compartmentId}/isTaken",
    instance: "medsmart-d8446-default-rtdb" 
  }, 
  async (event) => {
    const isTaken = event.data.after.val();
    if (isTaken !== true) return null;

    const { deviceId, compartmentId } = event.params;
    const db = admin.firestore();
    const rtdb = admin.database();

    try {
        const deviceSnapshot = await rtdb.ref(`devices/${deviceId}/owner`).once('value');
        const userId = deviceSnapshot.val();
        if (!userId) return null;

        // Mark Empty
        await db.collection('medboxes').doc(userId).update({ [`${compartmentId}.isEmpty`]: true });

        // Log Success
        await db.collection('activity_log').add({
            userId: userId, type: 'success', title: 'Medication Taken',
            message: `Confirmed via button press (${compartmentId}).`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: compartmentId
        });

        // Reset Hardware
        await rtdb.ref(`devices/${deviceId}/compartments/${compartmentId}`).update({ isTaken: false, isOpen: false });

    } catch (error) { console.error(error); }
});