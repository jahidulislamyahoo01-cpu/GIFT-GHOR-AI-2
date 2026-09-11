import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  Firestore,
} from 'firebase/firestore/lite';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function getFirestoreInstance(): Firestore | null {
  if (firestoreDb) return firestoreDb;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('[Firebase] firebase-applet-config.json not found. Falling back to local storage.');
      return null;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApps()[0];
    }

    const dbId = config.firestoreDatabaseId || '(default)';
    firestoreDb = getFirestore(firebaseApp, dbId);
    console.log(`[Firebase] Firestore initialized successfully with database: ${dbId}`);
    return firestoreDb;
  } catch (err) {
    console.error('[Firebase] Failed to initialize Firestore:', err);
    return null;
  }
}

/**
 * Loads all state from Firestore (app_settings, orders, chat_sessions)
 */
export async function loadStateFromFirestore(): Promise<{
  settings?: any;
  orders?: Record<string, any>;
  sessions?: Record<string, any>;
} | null> {
  const db = getFirestoreInstance();
  if (!db) return null;

  try {
    const result: {
      settings?: any;
      orders?: Record<string, any>;
      sessions?: Record<string, any>;
    } = {};

    // 1. Load global settings (branding, deliveryPolicy, faqs, crawledPages, uploadedFiles, adminPasswordHash, etc.)
    const settingsDoc = doc(db, 'app_settings', 'global');
    const settingsSnap = await getDoc(settingsDoc);
    if (settingsSnap.exists()) {
      result.settings = settingsSnap.data();
      console.log('[Firebase] Loaded global settings from Firestore');
    }

    // 2. Load orders collection
    try {
      const ordersCol = collection(db, 'orders');
      const ordersSnap = await getDocs(ordersCol);
      const orders: Record<string, any> = {};
      ordersSnap.forEach((d) => {
        orders[d.id] = d.data();
      });
      result.orders = orders;
      console.log(`[Firebase] Loaded ${Object.keys(orders).length} orders from Firestore`);
    } catch (e) {
      console.warn('[Firebase] Could not load orders collection:', e);
    }

    // 3. Load chat sessions collection
    try {
      const sessionsCol = collection(db, 'chat_sessions');
      const sessionsSnap = await getDocs(sessionsCol);
      const sessions: Record<string, any> = {};
      sessionsSnap.forEach((d) => {
        sessions[d.id] = d.data();
      });
      result.sessions = sessions;
      console.log(`[Firebase] Loaded ${Object.keys(sessions).length} sessions from Firestore`);
    } catch (e) {
      console.warn('[Firebase] Could not load chat_sessions collection:', e);
    }

    return result;
  } catch (err) {
    console.error('[Firebase] Error loading state from Firestore:', err);
    return null;
  }
}

/**
 * Saves global settings to Firestore doc app_settings/global
 */
export async function saveSettingsToFirestore(data: {
  adminPasswordHash: string;
  adminSettings?: any;
  branding: any;
  deliveryPolicy: any;
  products: any[];
  crawledPages: any[];
  uploadedFiles: any[];
  faqs: any[];
  lastTrainedAt: string;
  trainingVersion: number;
}): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const settingsDoc = doc(db, 'app_settings', 'global');
    await setDoc(settingsDoc, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to save settings to Firestore:', err);
    return false;
  }
}

/**
 * Saves single order to Firestore collection 'orders'
 */
export async function saveOrderToFirestore(order: any): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db || !order || !order.id) return false;

  try {
    const orderDoc = doc(db, 'orders', order.id);
    await setDoc(orderDoc, {
      ...order,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to save order ${order.id} to Firestore:`, err);
    return false;
  }
}

/**
 * Deletes order from Firestore collection 'orders'
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db || !orderId) return false;

  try {
    const orderDoc = doc(db, 'orders', orderId);
    await deleteDoc(orderDoc);
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to delete order ${orderId} from Firestore:`, err);
    return false;
  }
}

/**
 * Saves single session to Firestore collection 'chat_sessions'
 */
export async function saveSessionToFirestore(session: any): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db || !session || !session.id) return false;

  try {
    const sessionDoc = doc(db, 'chat_sessions', session.id);
    await setDoc(sessionDoc, {
      ...session,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error(`[Firebase] Failed to save session ${session.id} to Firestore:`, err);
    return false;
  }
}

/**
 * Saves a notification log (orders, live agent requests, OTP) to Firestore
 */
export async function saveNotificationToFirestore(notification: {
  id: string;
  type: 'order' | 'live_agent' | 'otp';
  recipients: string[];
  subject: string;
  details: any;
  sentAt: string;
  status: string;
}): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const notifDoc = doc(db, 'notifications', notification.id);
    await setDoc(notifDoc, notification);
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to save notification to Firestore:', err);
    return false;
  }
}
