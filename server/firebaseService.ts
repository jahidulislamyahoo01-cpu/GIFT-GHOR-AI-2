import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore/lite';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let isQuotaExceeded = false;
let quotaExceededAt = 0;

function checkQuotaError(err: any): boolean {
  const msg = err?.message || String(err);
  if (msg.includes('Quota limit exceeded') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED')) {
    if (!isQuotaExceeded) {
      console.warn('[Firebase] Firestore daily write quota limit exceeded. Switching to local storage fallback.');
    }
    isQuotaExceeded = true;
    quotaExceededAt = Date.now();
    return true;
  }
  return false;
}

function shouldSkipFirestoreWrite(): boolean {
  if (isQuotaExceeded) {
    // Retry after 1 hour (3600000 ms) in case quota reset
    if (Date.now() - quotaExceededAt > 3600000) {
      isQuotaExceeded = false;
      return false;
    }
    return true;
  }
  return false;
}

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
  teamMembers?: any[];
  branding: any;
  deliveryPolicy: any;
  products: any[];
  crawledPages: any[];
  uploadedFiles: any[];
  faqs: any[];
  lastTrainedAt: string;
  trainingVersion: number;
}): Promise<boolean> {
  if (shouldSkipFirestoreWrite()) return false;
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    // 1. Sanitize crawled pages to prevent exceeding Firestore 1MB document limit
    const sanitizedCrawledPages = Array.isArray(data.crawledPages)
      ? data.crawledPages.map((p) => {
          let summary = typeof p.contentSummary === 'string' ? p.contentSummary : '';
          if (summary.length > 2000) {
            summary = summary.substring(0, 2000);
          }
          return {
            id: p.id,
            url: p.url,
            title: p.title || 'Gift Ghor Page',
            pageType: p.pageType || 'page',
            status: p.status || 'success',
            wordCount: p.wordCount || 0,
            itemsFound: p.itemsFound || 1,
            crawledAt: p.crawledAt || new Date().toISOString(),
            contentSummary: summary,
          };
        })
      : [];

    // 2. Sanitize uploaded files
    const sanitizedUploadedFiles = Array.isArray(data.uploadedFiles)
      ? data.uploadedFiles.map((f) => ({
          ...f,
          rawContent: typeof f.rawContent === 'string' ? f.rawContent.substring(0, 4000) : '',
        }))
      : [];

    let payload: any = {
      adminPasswordHash: data.adminPasswordHash,
      adminSettings: data.adminSettings,
      teamMembers: data.teamMembers || [],
      branding: data.branding,
      deliveryPolicy: data.deliveryPolicy,
      products: data.products,
      crawledPages: sanitizedCrawledPages,
      uploadedFiles: sanitizedUploadedFiles,
      faqs: data.faqs,
      lastTrainedAt: data.lastTrainedAt,
      trainingVersion: data.trainingVersion,
      updatedAt: new Date().toISOString(),
    };

    // Calculate approximate payload size in bytes
    let payloadSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');

    // If approaching 700KB (Firestore limit is 1,048,576 bytes = 1MB), compress crawled summaries further
    if (payloadSize > 700000) {
      console.warn(`[Firebase] Notice: Payload size (${payloadSize} bytes) is high. Compressing crawled pages for Firestore...`);
      payload.crawledPages = sanitizedCrawledPages.map((p) => ({
        ...p,
        contentSummary: p.contentSummary ? p.contentSummary.substring(0, 600) : '',
      }));
      payloadSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');
      console.log(`[Firebase] Reduced payload size to ${payloadSize} bytes`);
    }

    const settingsDoc = doc(db, 'app_settings', 'global');
    await setDoc(settingsDoc, payload);
    console.log(`[Firebase] Global settings successfully saved to Firestore (${(payloadSize / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err: any) {
    if (checkQuotaError(err)) return false;
    console.error('[Firebase] Failed to save settings to Firestore:', err);

    // Fallback: If it still hit a size error, attempt writing without crawledPages content summaries
    if (err && (err.message?.includes('exceeds the maximum allowed size') || err.message?.includes('cannot be written because its size'))) {
      try {
        console.warn('[Firebase] Attempting fallback lightweight save to Firestore...');
        const minimalCrawledPages = (data.crawledPages || []).map((p) => ({
          id: p.id,
          url: p.url,
          title: p.title,
          pageType: p.pageType,
          status: p.status,
          wordCount: p.wordCount,
          itemsFound: p.itemsFound,
          crawledAt: p.crawledAt,
          contentSummary: typeof p.contentSummary === 'string' ? p.contentSummary.substring(0, 200) : '',
        }));

        const fallbackPayload = {
          adminPasswordHash: data.adminPasswordHash,
          adminSettings: data.adminSettings,
          branding: data.branding,
          deliveryPolicy: data.deliveryPolicy,
          products: data.products,
          crawledPages: minimalCrawledPages,
          uploadedFiles: (data.uploadedFiles || []).map((f) => ({ ...f, rawContent: (f.rawContent || '').substring(0, 1000) })),
          faqs: data.faqs,
          lastTrainedAt: data.lastTrainedAt,
          trainingVersion: data.trainingVersion,
          updatedAt: new Date().toISOString(),
        };

        const settingsDoc = doc(db, 'app_settings', 'global');
        await setDoc(settingsDoc, fallbackPayload);
        console.log('[Firebase] Fallback settings successfully saved to Firestore.');
        return true;
      } catch (fallbackErr) {
        checkQuotaError(fallbackErr);
        console.error('[Firebase] Fallback save also failed:', fallbackErr);
      }
    }
    return false;
  }
}

/**
 * Saves single order to Firestore collection 'orders'
 */
export async function saveOrderToFirestore(order: any): Promise<boolean> {
  if (shouldSkipFirestoreWrite()) return false;
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
    if (checkQuotaError(err)) return false;
    console.error(`[Firebase] Failed to save order ${order.id} to Firestore:`, err);
    return false;
  }
}

/**
 * Deletes order from Firestore collection 'orders'
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  if (shouldSkipFirestoreWrite()) return false;
  const db = getFirestoreInstance();
  if (!db || !orderId) return false;

  try {
    const orderDoc = doc(db, 'orders', orderId);
    await deleteDoc(orderDoc);
    return true;
  } catch (err) {
    if (checkQuotaError(err)) return false;
    console.error(`[Firebase] Failed to delete order ${orderId} from Firestore:`, err);
    return false;
  }
}

/**
 * Saves single session to Firestore collection 'chat_sessions'
 */
export async function saveSessionToFirestore(session: any): Promise<boolean> {
  if (shouldSkipFirestoreWrite()) return false;
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
    if (checkQuotaError(err)) return false;
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
  if (shouldSkipFirestoreWrite()) return false;
  const db = getFirestoreInstance();
  if (!db) return false;

  try {
    const notifDoc = doc(db, 'notifications', notification.id);
    await setDoc(notifDoc, notification);
    return true;
  } catch (err) {
    if (checkQuotaError(err)) return false;
    console.error('[Firebase] Failed to save notification to Firestore:', err);
    return false;
  }
}
