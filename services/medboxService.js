import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ref, set, onValue, off } from 'firebase/database';
import { db, rtdb } from '../config/firebaseConfig';

// --- 1. DEVICE STATUS (The Missing Function) ---
export const subscribeToDeviceStatus = (deviceId, callback) => {
  // If no device, return 'not_connected'
  if (!deviceId || deviceId === 'Not Connected') {
    callback('not_connected');
    return () => {};
  }

  const heartbeatRef = ref(rtdb, `devices/${deviceId}/heartbeat`);
  let lastSeen = 0;

  // Listen to realtime heartbeat
  const unsubscribe = onValue(heartbeatRef, (snapshot) => {
    const timestamp = snapshot.val();
    if (timestamp) {
      lastSeen = timestamp;
      callback('online'); // Instant update on change
    }
  });

  // "Deadman Switch" Interval: Check every 2 seconds
  const intervalId = setInterval(() => {
    const now = Date.now();
    // If heartbeat is older than 15 seconds -> Offline
    if (lastSeen > 0 && (now - lastSeen) > 15000) {
      callback('offline');
    } else if (lastSeen > 0) {
      callback('online');
    }
  }, 2000);

  return () => {
    off(heartbeatRef);
    clearInterval(intervalId);
  };
};

// --- 2. LINKING ---
export const linkDeviceToAccount = async (userId, deviceId) => {
  try {
    // Update Firestore
    await updateDoc(doc(db, 'users', userId), {
      deviceId: deviceId
    });

    // Update Realtime DB (Handshake)
    if (rtdb) {
      const ownerRef = ref(rtdb, `devices/${deviceId}/owner`);
      await set(ownerRef, userId);
    }
    return true;
  } catch (error) {
    console.error("Linking failed:", error);
    throw error;
  }
};

// --- 3. MEDBOX DATA LISTENER ---
export const subscribeToMedbox = (userId, callback, onError) => {
  const medboxRef = doc(db, 'medboxes', userId);

  return onSnapshot(medboxRef, async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const compartmentsArray = Object.keys(data)
        .map(key => ({ id: key, ...data[key] }))
        .sort((a, b) => a.id.localeCompare(b.id));
      
      callback(compartmentsArray);
    } else {
      await initializeMedbox(userId);
    }
  }, onError);
};

// --- 4. INITIALIZER ---
export const initializeMedbox = async (userId) => {
  const initialData = {};
  ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'].forEach(id => {
    initialData[id] = { medName: null, description: null, days: [], time: null, isEmpty: false };
  });
  await setDoc(doc(db, 'medboxes', userId), initialData);
};

// --- 5. SAVE ---
export const saveCompartment = async (userId, deviceId, compartmentId, data) => {
  const cleanTime = data.time ? data.time.replace(/[\u202f\u00a0]/g, " ").trim() : null;
  const cleanData = { ...data, time: cleanTime };

  await updateDoc(doc(db, 'medboxes', userId), { [compartmentId]: cleanData });

  if (rtdb && deviceId && deviceId !== 'Not Connected') {
    const rtdbRef = ref(rtdb, `devices/${deviceId}/compartments/${compartmentId}`);
    await set(rtdbRef, {
      medName: cleanData.medName,
      time: cleanData.time,
      isOpen: false, 
      isTaken: false
    });
  }
};

// --- 6. DELETE ---
export const deleteCompartment = async (userId, deviceId, compartmentId) => {
  const emptyData = { medName: null, description: null, days: [], time: null, isEmpty: false };
  
  await updateDoc(doc(db, 'medboxes', userId), { [compartmentId]: emptyData });

  if (rtdb && deviceId && deviceId !== 'Not Connected') {
    const rtdbRef = ref(rtdb, `devices/${deviceId}/compartments/${compartmentId}`);
    await set(rtdbRef, { medName: null, time: null, isOpen: false, isTaken: false });
  }
};

// --- 7. TAKE DOSE NOW ---
export const takeDoseNow = async (userId, deviceId, compartmentId) => {
  if (rtdb && deviceId && deviceId !== 'Not Connected') {
    const rtdbRef = ref(rtdb, `devices/${deviceId}/compartments/${compartmentId}`);
    await set(rtdbRef, { isOpen: true, isTaken: false });
  }
  await updateDoc(doc(db, 'medboxes', userId), { [`${compartmentId}.isEmpty`]: true });
};