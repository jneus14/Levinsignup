
import { initializeApp } from "firebase/app";
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
  getDoc
} from "firebase/firestore";
import { DiscussionSession } from "../types";
import { INITIAL_SESSIONS } from "../constants";

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

// Standard initialization for Firebase modular SDK
// The initializeApp function is exported from "firebase/app" in Firebase v9+
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const SESSIONS_COLLECTION = "sessions";

/**
 * Seed the database with initial sessions.
 * Checks for missing sessions from INITIAL_SESSIONS and adds them if they don't exist.
 */
export const seedDatabase = async () => {
  try {
    const batch = writeBatch(db);
    let hasChanges = false;

    for (const session of INITIAL_SESSIONS) {
      const docRef = doc(db, SESSIONS_COLLECTION, session.id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log(`Adding missing session: ${session.faculty}`);
        batch.set(docRef, session);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await batch.commit();
      console.log("Database seeded with new sessions.");
    }
  } catch (error: any) {
    console.error("Error during database seeding:", error);
    // Re-throw so the UI can catch permission-denied
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
      onError(error);
    }
  );
};

/**
 * Update a specific session document (Full overwrite)
 * Used for registration where we modify participants
 */
export const updateSessionDoc = async (session: DiscussionSession) => {
  const docRef = doc(db, SESSIONS_COLLECTION, session.id);
  await updateDoc(docRef, { ...session });
};

/**
 * Update only session details (Metadata)
 * Used for admin edits to avoid overwriting concurrent participant updates
 */
export const updateSessionDetails = async (session: DiscussionSession) => {
  const docRef = doc(db, SESSIONS_COLLECTION, session.id);
  const { participants, waitlist, ...metadata } = session;
  await updateDoc(docRef, { ...metadata });
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
