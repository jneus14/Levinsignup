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
  limit,
  runTransaction
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { DiscussionSession, Student } from '../types';
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
      console.error("Firestore subscription error:", error);
      onError(error);
    }
  );
};

export const updateSessionDoc = async (session: DiscussionSession) => {
  const docRef = doc(db, SESSIONS_COLLECTION, session.id);
  await updateDoc(docRef, { ...session });
};

export const addSessionDoc = async (session: DiscussionSession) => {
  const docRef = doc(db, SESSIONS_COLLECTION, session.id);
  await setDoc(docRef, session);
};

export const deleteSessionDoc = async (sessionId: string) => {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await deleteDoc(docRef);
};

/**
 * Register a student for a session using a transaction to prevent race conditions.
 */
export const registerStudent = async (sessionId: string, name: string, email: string, classYear: string) => {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

  return await runTransaction(db, async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists()) {
      throw new Error("Session not found");
    }

    const session = sessionDoc.data() as DiscussionSession;

    // Case-insensitive email check
    const emailLower = email.toLowerCase().trim();
    const isRegistered = session.participants.some(p => p.email.toLowerCase() === emailLower);
    const isWaitlisted = session.waitlist.some(p => p.email.toLowerCase() === emailLower);

    if (isRegistered || isWaitlisted) {
      throw new Error("You are already registered for this session.");
    }

    const isFull = !session.isUnlimited && session.participants.length >= session.capacity;
    
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.trim(),
      classYear,
      timestamp: Date.now()
    };

    const updates: Partial<DiscussionSession> = {};

    if (isFull) {
      updates.waitlist = [...session.waitlist, newStudent];
    } else {
      updates.participants = [...session.participants, newStudent];
    }

    transaction.update(sessionRef, updates);

    // Return the updated state context for the UI
    return { 
      student: newStudent, 
      session: { ...session, ...updates },
      isWaitlist: isFull 
    };
  });
};