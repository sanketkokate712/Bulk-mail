import { db } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

// User methods
export const saveUser = async (user) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  }, { merge: true });
};

export const getUserSettings = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

// Campaign methods
export const createCampaign = async (userId, metadata, recipients) => {
  // 1. Create campaign document
  const campaignsRef = collection(db, 'campaigns');
  const campaignDoc = await addDoc(campaignRef, {
    userId,
    name: metadata.subject || 'Untitled Campaign',
    template: metadata,
    totalRecipients: recipients.length,
    sentCount: 0,
    bouncedCount: 0,
    failedCount: 0,
    pendingCount: recipients.length,
    status: 'draft', // draft | sending | paused | completed
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const campaignId = campaignDoc.id;

  // 2. Add recipients to subcollection (In real world, batch this if > 500)
  // For demo/simplicity, we're doing promises.all but Firestore batches are better for prod
  const recipientsRef = collection(db, 'campaigns', campaignId, 'recipients');
  
  const recipientPromises = recipients.map((recipient, index) => {
    return addDoc(recipientsRef, {
      ...recipient, // row data
      index,
      status: 'pending', // pending | sent | bounced | failed
      message: null,
      timestamp: null
    });
  });

  await Promise.all(recipientPromises);

  return campaignId;
};

export const updateCampaignStatus = async (campaignId, status) => {
  const campaignRef = doc(db, 'campaigns', campaignId);
  await updateDoc(campaignRef, {
    status,
    updatedAt: serverTimestamp()
  });
};

export const updateRecipientStatus = async (campaignId, recipientId, statusInfo) => {
  const recipientRef = doc(db, 'campaigns', campaignId, 'recipients', recipientId);
  await updateDoc(recipientRef, {
    status: statusInfo.status,
    message: statusInfo.message,
    timestamp: new Date().toLocaleTimeString() // Format better in real app
  });
};

// Listeners for real-time UI
export const subscribeToCampaign = (campaignId, callback) => {
  const campaignRef = doc(db, 'campaigns', campaignId);
  return onSnapshot(campaignRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

export const subscribeToRecipients = (campaignId, callback) => {
  const q = query(
    collection(db, 'campaigns', campaignId, 'recipients'),
    orderBy('index', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const recipients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(recipients);
  });
};

export const getUserCampaigns = async (userId) => {
  const q = query(
    collection(db, 'campaigns'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // convert timestamps for UI safely
    date: doc.data().createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
  }));
};
