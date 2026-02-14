
import { initializeApp, getApps, getApp } from 'firebase/app';
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

const firebaseConfig = {
  apiKey: "AIzaSyB0oQteZZT7k2AIEY0vuIPWiZQfSFxftDE",
  authDomain: "sls-levin-signups.firebaseapp.com",
  projectId: "sls-levin-signups",
  storageBucket: "sls-levin-signups.firebasestorage.app",
  messagingSenderId: "822586706834",
  appId: "1:822586706834:web:c25a5fd548dc2e99d7cf4b",
  measurementId: "G-8F1EZ6P97N"
};

// Singleton pattern for Firebase initialization
// Using try-catch to handle potential initialization race conditions
let app;
try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
    console.error("Firebase initialization error:", error);
    // Fallback if getApp fails unexpectedly
    app = initializeApp(firebaseConfig, "fallback"); 
}

export const db: Firestore = getFirestore(app);

const SESSIONS_COLLECTION = "sessions";

/**
 * Seed the database with initial sessions if it's empty.
 * This ensures data persistence and prevents overwriting user data on app reload.
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
      console.log("Seeding complete. Data is now securely stored in Firestore.");
    } else {
        console.log("Database already initialized. Skipping seed to preserve user data.");
    }
  } catch (error: any) {
    console.error("Error during database seeding:", error);
    throw error;
  }
};

/**
 * Clears the sessions collection.
 */
export const clearDatabase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, SESSIONS_COLLECTION));
    const batch = writeBatch(db);
    querySnapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    console.log("Database cleared.");
  } catch (error) {
    console.error("Error clearing database:", error);
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
      console.error("Firestore subscription error:", error);
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
