import { collection, query, where, orderBy, onSnapshot, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// --- Listen to Activity Log ---
export const subscribeToActivity = (userId, callback, onError) => {
  const q = query(
    collection(db, 'activity_log'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    callback(logs);
  }, onError);
};

// --- Mark All As Read ---
export const markAllAsRead = async (userId, activities) => {
  const batch = writeBatch(db);
  const unreadItems = activities.filter(item => !item.isRead);
  
  if (unreadItems.length === 0) return;

  unreadItems.forEach(item => {
    const docRef = doc(db, 'activity_log', item.id);
    batch.update(docRef, { isRead: true });
  });

  await batch.commit();
};

// --- NEW: Clear Activity History ---
export const clearActivityHistory = async (userId) => {
  // 1. Query all logs for this user
  const q = query(
    collection(db, 'activity_log'), 
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  // 2. Batch Delete
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 3. Commit
  await batch.commit();
};