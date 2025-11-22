const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onValueWritten } = require("firebase-functions/v2/database");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "asia-southeast1" });

function getTimeWithOffset(date, offsetMinutes) {
  const targetTime = new Date(date.getTime() + offsetMinutes * 60000);
  let hours = targetTime.getHours();
  let minutes = targetTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const pad = (num) => num < 10 ? '0'+num : num;
  return [
    `${hours}:${pad(minutes)} ${ampm}`,
    `${pad(hours)}:${pad(minutes)} ${ampm}`
  ];
}

function getCurrentDay(date) {
  const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[date.getDay()];
}

exports.checkMedicationSchedule = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Manila",
}, async (event) => {
  const now = new Date();
  const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
  const currentDay = getCurrentDay(manilaTime);
  const timesUpcoming = getTimeWithOffset(manilaTime, 3);
  const timesOpen = getTimeWithOffset(manilaTime, 1);
  const timesClose = getTimeWithOffset(manilaTime, -1);
  const timesMissed = getTimeWithOffset(manilaTime, -10);

  console.log(`CHECKING: ${currentDay}`);

  const db = admin.firestore();
  const rtdb = admin.database();
  const medboxesSnapshot = await db.collection('medboxes').get();
  const batch = db.batch();
  let actionsExecuted = 0;

  for (const doc of medboxesSnapshot.docs) {
    const userId = doc.id;
    const compartments = doc.data();
    const userDoc = await db.collection('users').doc(userId).get();
    const deviceId = userDoc.data()?.deviceId;
    const isDeviceConnected = (deviceId && deviceId !== 'Not Connected');

    for (const key of Object.keys(compartments)) {
      const med = compartments[key];
      const dbTime = med.time ? med.time.replace(/[\u202f\u00a0]/g, " ").trim() : null;
      if (!med.medName || !med.days.includes(currentDay) || !dbTime) continue;

      if (timesUpcoming.includes(dbTime)) {
        console.log(`🟡 UPCOMING: ${med.medName} (${key})`);
        const ref = db.collection('activity_log').doc();
        batch.set(ref, {
          userId: userId, type: 'warning', title: 'Upcoming Medication',
          message: `Prepare to take ${med.medName} in 3 minutes.`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: key
        });
        actionsExecuted++;
      }
      else if (timesOpen.includes(dbTime)) {
        console.log(`🟢 OPEN SIGNAL: ${med.medName} (${key})`);
        const ref = db.collection('activity_log').doc();
        batch.set(ref, {
          userId: userId, type: 'success', title: 'Time to take Medicine',
          message: `Please take ${med.medName}. Box Opening...`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: key
        });
        if (isDeviceConnected) {
          console.log(`   -> HW OPEN: Comp ${key}`);
          await rtdb.ref(`devices/${deviceId}/compartments/${key}`).update({ isOpen: true });
        }
        actionsExecuted++;
      }
      else if (timesClose.includes(dbTime)) {
        if (isDeviceConnected) {
          console.log(`🔒 HW CLOSE: Comp ${key}`);
          await rtdb.ref(`devices/${deviceId}/compartments/${key}`).update({ isOpen: false });
        }
      }
      else if (timesMissed.includes(dbTime)) {
        if (med.isEmpty === false) {
          console.log(`🔴 MISSED DOSE: ${med.medName} (${key})`);
          const ref = db.collection('activity_log').doc();
          batch.set(ref, {
            userId: userId, type: 'alert', title: 'Missed Dose Alert',
            message: `You missed your ${med.time} dose!`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: key
          });
          actionsExecuted++;
        }
      }
    }
  }

  if (actionsExecuted > 0) await batch.commit();
  return null;
});

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

      await db.collection('medboxes').doc(userId).update({ [`${compartmentId}.isEmpty`]: true });
      await db.collection('activity_log').add({
        userId: userId, type: 'success', title: 'Medication Taken',
        message: `Confirmed via button press (${compartmentId}).`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(), isRead: false, compartmentId: compartmentId
      });
      await rtdb.ref(`devices/${deviceId}/compartments/${compartmentId}`).update({ isTaken: false, isOpen: false });
    } catch (error) { console.error(error); }
});