/**
 * Firebase Firestore 연동 설정 파일
 *
 * [파이어베이스 연결 방법]
 * 1. https://console.firebase.google.com/ 에 접속하여 프로젝트를 생성합니다.
 * 2. '웹 앱 추가(</> 아이콘)'를 클릭하고 앱을 등록합니다.
 * 3. 발급받은 firebaseConfig 값들을 아래 객체에 그대로 붙여넣습니다.
 *    (또는 .env 파일에 VITE_FIREBASE_* 형태로 입력해도 자동 적용됩니다)
 * 4. Firebase 콘솔 좌측 메뉴에서 [빌드] -> [Firestore Database]를 생성합니다.
 *    - 위치는 서울(asia-northeast3) 권장
 *    - 규칙(Rules) 탭에서 'allow read, write: if true;'로 설정하면 바로 테스트 가능합니다.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { Order, Customer, AppSettings } from '../types';

// ============================================================================
// ⚠️ 아래 정보를 본인의 파이어베이스 콘솔에서 복사한 값으로 채워 넣으세요!
// (또는 앱 내 [설정] -> [파이어베이스 클라우드 동기화] 메뉴에서 직접 붙여넣으셔도 됩니다)
// ============================================================================
export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseConfig: FirebaseAppConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAjoHCH_XJvb4OWOO_os0f7V3-U3yEPJTE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mandarin-order-haechansol.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mandarin-order-haechansol',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mandarin-order-haechansol.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '246552705090',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:246552705090:web:9d0a2bf2614e914e96d5db',
};

export const FIREBASE_STORAGE_KEY = 'jeju_tangerine_firebase_config_v1';

// 활성화된 Firebase 설정 가져오기 (항상 검증된 firebaseConfig 반환)
export const getActiveFirebaseConfig = (): FirebaseAppConfig => {
  return firebaseConfig;
};

// 사용자가 UI에서 입력한 Firebase 설정 저장 또는 해제
export const saveCustomFirebaseConfig = (cfg: FirebaseAppConfig | null) => {
  if (!cfg) {
    localStorage.removeItem(FIREBASE_STORAGE_KEY);
  } else {
    localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(cfg));
  }
  // 싱글톤 리셋
  app = null;
  db = null;
};

// 파이어베이스 설정이 유효한지 검사하는 함수
export const isFirebaseConfigured = (): boolean => {
  const conf = getActiveFirebaseConfig();
  return (
    conf.apiKey !== 'YOUR_API_KEY' &&
    Boolean(conf.apiKey) &&
    conf.projectId !== 'YOUR_PROJECT_ID' &&
    Boolean(conf.projectId)
  );
};

// Firebase & Firestore 싱글톤 인스턴스 초기화
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const getFirebaseDb = (): Firestore | null => {
  if (!isFirebaseConfigured()) return null;

  try {
    const conf = getActiveFirebaseConfig();
    if (!app) {
      app = getApps().length > 0 ? getApp() : initializeApp(conf);
    }
    if (!db) {
      db = getFirestore(app);
    }
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

// ============================================================================
// 1. 주문(Orders) 실시간 동기화 및 CRUD
// ============================================================================

export const subscribeOrdersFromDb = (
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void
) => {
  const firestore = getFirebaseDb();
  if (!firestore) return () => {};

  const ordersCol = collection(firestore, 'orders');

  return onSnapshot(
    ordersCol,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onData(orders);
    },
    (err) => {
      console.error('Error subscribing to orders:', err);
      if (onError) onError(err);
    }
  );
};

// Helper to remove undefined fields so Firestore setDoc does not throw
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean;
  }
  return obj;
}

export const saveOrderToDb = async (order: Order): Promise<{ success: boolean; error?: string }> => {
  const firestore = getFirebaseDb();
  if (!firestore) return { success: false, error: 'Firebase not configured' };

  try {
    const docRef = doc(firestore, 'orders', order.id);
    const data = sanitizeForFirestore(order);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error('Error saving order to Firebase:', err);
    return { success: false, error: err?.message || '저장 오류' };
  }
};

export const deleteOrderFromDb = async (orderId: string): Promise<{ success: boolean; error?: string }> => {
  const firestore = getFirebaseDb();
  if (!firestore) return { success: false, error: 'Firebase not configured' };

  try {
    const docRef = doc(firestore, 'orders', orderId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting order from Firebase:', err);
    return { success: false, error: err?.message || '삭제 오류' };
  }
};

// ============================================================================
// 2. 고객 주소록(Customers) 실시간 동기화 및 CRUD
// ============================================================================

export const subscribeCustomersFromDb = (
  onData: (customers: Customer[]) => void,
  onError?: (error: Error) => void
) => {
  const firestore = getFirebaseDb();
  if (!firestore) return () => {};

  const customersCol = collection(firestore, 'customers');

  return onSnapshot(
    customersCol,
    (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach((docSnap) => {
        customers.push({ id: docSnap.id, ...docSnap.data() } as Customer);
      });
      customers.sort((a, b) => (b.lastOrderedAt || '').localeCompare(a.lastOrderedAt || ''));
      onData(customers);
    },
    (err) => {
      console.error('Error subscribing to customers:', err);
      if (onError) onError(err);
    }
  );
};

export const saveCustomerToDb = async (customer: Customer): Promise<{ success: boolean; error?: string }> => {
  const firestore = getFirebaseDb();
  if (!firestore) return { success: false, error: 'Firebase not configured' };

  try {
    const docRef = doc(firestore, 'customers', customer.id);
    const data = sanitizeForFirestore(customer);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error('Error saving customer to Firebase:', err);
    return { success: false, error: err?.message || '고객 저장 오류' };
  }
};

export const deleteCustomerFromDb = async (customerId: string): Promise<{ success: boolean; error?: string }> => {
  const firestore = getFirebaseDb();
  if (!firestore) return { success: false, error: 'Firebase not configured' };

  try {
    const docRef = doc(firestore, 'customers', customerId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting customer from Firebase:', err);
    return { success: false, error: err?.message || '고객 삭제 오류' };
  }
};

// ============================================================================
// 3. 환경설정(Settings: 단가, 계좌정보, 템플릿) 실시간 동기화
// ============================================================================

export const subscribeSettingsFromDb = (
  onData: (settings: AppSettings) => void,
  onError?: (error: Error) => void
) => {
  const firestore = getFirebaseDb();
  if (!firestore) return () => {};

  const docRef = doc(firestore, 'settings', 'app_settings');

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as AppSettings);
      }
    },
    (err) => {
      console.error('Error subscribing to settings:', err);
      if (onError) onError(err);
    }
  );
};

export const saveSettingsToDb = async (settings: AppSettings): Promise<{ success: boolean; error?: string }> => {
  const firestore = getFirebaseDb();
  if (!firestore) return { success: false, error: 'Firebase not configured' };

  try {
    const docRef = doc(firestore, 'settings', 'app_settings');
    const data = sanitizeForFirestore(settings);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error('Error saving settings to Firebase:', err);
    return { success: false, error: err?.message || '설정 저장 오류' };
  }
};

export const clearAllFirestoreData = async (): Promise<{ success: boolean; error?: string }> => {
  const firestore = getFirebaseDb();
  if (!firestore) return { success: false, error: '파이어베이스가 연결되지 않았습니다.' };

  try {
    const ordersCol = collection(firestore, 'orders');
    const ordersSnap = await getDocs(ordersCol);
    for (const d of ordersSnap.docs) {
      await deleteDoc(d.ref);
    }

    const custCol = collection(firestore, 'customers');
    const custSnap = await getDocs(custCol);
    for (const d of custSnap.docs) {
      await deleteDoc(d.ref);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error clearing Firestore data:', err);
    return { success: false, error: err?.message || '초기화 오류' };
  }
};


