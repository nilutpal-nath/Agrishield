import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Must pass firestoreDatabaseId as required by skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Skill constraint: Test connection to Firestore on initialization
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or initializing connection.');
    }
  }
}

// Run test connection
testConnection();

// User Profile Data Contract
export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

// Record Data Contract
export interface DbScanRecord {
  id: string;
  userId: string;
  date: string;
  disease: string;
  pathogen?: string;
  crop?: string;
  location: string;
  status: 'Follow-up Required' | 'Active Treatment' | 'Resolved' | 'Monitoring';
  confidence: number;
  imageCount?: number;
  lossMitigated?: string;
  notes?: string;
  daysAgo?: number;
  createdAt: string;
  updatedAt?: string;
  recoveryImages?: string[];
}

// Authentication Helpers
export async function registerWithEmail(email: string, pass: string, name: string, role = 'Field Agronomist') {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    await updateProfile(cred.user, { displayName: name });
    const profilePath = `users/${cred.user.uid}`;
    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        id: cred.user.uid,
        email: cred.user.email || email,
        displayName: name,
        role,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, profilePath);
    }
  }
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  if (cred.user) {
    const profilePath = `users/${cred.user.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, 'users', cred.user.uid), {
          id: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || 'Field Agronomist',
          role: 'Lead Agronomist',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, profilePath);
    }
  }
  return cred.user;
}

export async function resetUserPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  await signOut(auth);
}

// Database Helpers for Scan Records
export async function saveScanRecordToDb(userId: string, record: DbScanRecord) {
  const recordPath = `users/${userId}/records/${record.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'records', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, recordPath);
  }
}

export async function updateScanRecordInDb(userId: string, recordId: string, updates: Partial<DbScanRecord>) {
  const recordPath = `users/${userId}/records/${recordId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'records', recordId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, recordPath);
  }
}

export async function fetchUserRecordsFromDb(userId: string): Promise<DbScanRecord[]> {
  const recordsPath = `users/${userId}/records`;
  try {
    const q = collection(db, 'users', userId, 'records');
    const snapshot = await getDocs(q);
    const results: DbScanRecord[] = [];
    snapshot.forEach((d) => {
      results.push(d.data() as DbScanRecord);
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, recordsPath);
  }
}

export function subscribeToUserRecords(
  userId: string,
  onData: (records: DbScanRecord[]) => void,
  onError?: (err: unknown) => void
) {
  const recordsPath = `users/${userId}/records`;
  const colRef = collection(db, 'users', userId, 'records');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const results: DbScanRecord[] = [];
      snapshot.forEach((d) => {
        results.push(d.data() as DbScanRecord);
      });
      // Sort newest date or daysAgo
      results.sort((a, b) => (a.daysAgo ?? 0) - (b.daysAgo ?? 0));
      onData(results);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, recordsPath);
    }
  );
}
