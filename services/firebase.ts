// Fix: Separate value and type imports to resolve resolution issues in specific TS environments
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  getDocs, 
  writeBatch, 
  deleteDoc,
  query,
  limit
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { DiscussionSession } from '../types';
import { INITIAL_SESSIONS } from '../constants';

// Project specific configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0oQteZZT7k2AIEY0vuIPWiZQfSFxftDE",
  authDomain: "sls-levin-signups.firebaseapp.com",
  projectId: "sls-levin-signups",
  storageBucket: "sls-levin-signups.firebasestorage.app",
  messagingSenderId: "822586706834",
  appId: "1:822586706834:web:c25a5fd548dc2e99d7cf4b",
  measurementId: "G-8F1EZ6P97N"
};

// Initialize Firebase App
let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.error("Firebase app initialization failed, attempting fresh init", e);
  app = initializeApp(firebaseConfig);
}

// Initialize Firestore with the specific app instance
// This ensures the firestore service is explicitly linked to our initialized app.
export const db: Firestore = getFirestore(app);

const SESSIONS_COLLECTION = "sessions";

/**
 * Seed the database with initial sessions if it's empty
 */
export const seedDatabase = async () => {
  try {
    const q = query(collection(db, SESSIONS_COLLECTION), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("Database empty. Seeding initial sessions...");
      const batch = writeBatch(db);
      INITIAL_SESSIONS.forEach((session) => {
        const docRef = doc(db, SESSIONS_COLLECTION, session.id);
        batch.set(docRef, session);
      });
      await batch.commit();
      console.log("Seeding complete.");
    }
  } catch (error: any) {
    console.error("Error during database seeding:", error);
    throw error;
  }
};

/**
 * Listen for real-time changes to sessions
 */
export const subscribeToSessions = (
  callback: (sessions: DiscussionSession[]) => void, 
  onError: (error: any) => void
) => {
  return onSnapshot(
    collection(db, SESSIONS_COLLECTION), 
    (querySnapshot) => {
      const sessions: DiscussionSession[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push(doc.data() as DiscussionSession);
      });
      callback(sessions);
    },
    (error) => {
      onError(error);
    }
  );
};

/**
 * Update a specific session document
 */
export const updateSessionDoc = async (session: DiscussionSession) => {
  const docRef = doc(db, SESSIONS_COLLECTION, session.id);
  await updateDoc(docRef, { ...session });
};

/**
 * Add a new session document
 */
export const addSessionDoc = async (session: DiscussionSession) => {
  const docRef = doc(db, SESSIONS_COLLECTION, session.id);
  await setDoc(docRef, session);
};

/**
 * Delete a specific session document
 */
export const deleteSessionDoc = async (sessionId: string) => {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await deleteDoc(docRef);
};