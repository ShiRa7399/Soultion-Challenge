import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { EmergencyAlert, AlertStatus, OperationType } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const subscribeToAlerts = (callback: (alerts: EmergencyAlert[]) => void) => {
  const alertsRef = collection(db, 'alerts');
  const q = query(alertsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      ...doc.data(),
      alertId: doc.id
    } as EmergencyAlert));
    callback(alerts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'alerts');
  });
};

export const updateAlertStatus = async (alertId: string, status: AlertStatus) => {
  const alertRef = doc(db, 'alerts', alertId);
  try {
    await updateDoc(alertRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `alerts/${alertId}`);
  }
};

// For testing purposes (adding an alert)
export const createDemoAlert = async (alert: Omit<EmergencyAlert, 'alertId' | 'timestamp'>) => {
  const alertId = `alert-${Date.now()}`;
  const alertRef = doc(db, 'alerts', alertId);
  const newAlert = {
    ...alert,
    alertId,
    timestamp: new Date().toISOString()
  };
  
  try {
    await setDoc(alertRef, newAlert);
    return alertId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `alerts/${alertId}`);
  }
};
