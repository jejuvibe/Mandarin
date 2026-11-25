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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

export const FIREBASE_STORAGE_KEY = 'jeju_tangerine_firebase_config_v1';

// 활성화된 Firebase 설정 가져오기 (localStorage 저장값 우선 -> 없으면 기본 firebaseConfig)
export const getActiveFirebaseConfig = (): FirebaseAppConfig => {
  try {
    const saved = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId && parsed.apiKey !== 'YOUR_API_KEY') {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
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
  const q = query(ordersCol, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
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

export const saveOrderToDb = async (order: Order): Promise<void> => {
  const firestore = getFirebaseDb();
  if (!firestore) return;

  const docRef = doc(firestore, 'orders', order.id);
  const data = sanitizeForFirestore(order);
  await setDoc(docRef, data, { merge: true });
};

export const deleteOrderFromDb = async (orderId: string): Promise<void> => {
  const firestore = getFirebaseDb();
  if (!firestore) return;

  const docRef = doc(firestore, 'orders', orderId);
  await deleteDoc(docRef);
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
  const q = query(customersCol, orderBy('lastOrderedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach((docSnap) => {
        customers.push({ id: docSnap.id, ...docSnap.data() } as Customer);
      });
      onData(customers);
    },
    (err) => {
      console.error('Error subscribing to customers:', err);
      if (onError) onError(err);
    }
  );
};

export const saveCustomerToDb = async (customer: Customer): Promise<void> => {
  const firestore = getFirebaseDb();
  if (!firestore) return;

  const docRef = doc(firestore, 'customers', customer.id);
  const data = sanitizeForFirestore(customer);
  await setDoc(docRef, data, { merge: true });
};

export const deleteCustomerFromDb = async (customerId: string): Promise<void> => {
  const firestore = getFirebaseDb();
  if (!firestore) return;

  const docRef = doc(firestore, 'customers', customerId);
  await deleteDoc(docRef);
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

export const saveSettingsToDb = async (settings: AppSettings): Promise<void> => {
  const firestore = getFirebaseDb();
  if (!firestore) return;

  const docRef = doc(firestore, 'settings', 'app_settings');
  const data = sanitizeForFirestore(settings);
  await setDoc(docRef, data, { merge: true });
};
