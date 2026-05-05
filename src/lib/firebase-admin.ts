import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

// Use getters to avoid top-level initialization crashes during build
export const getAdminDb = () => {
  if (!admin.apps.length) return null as any;
  return admin.firestore();
};

export const getAdminAuth = () => {
  if (!admin.apps.length) return null as any;
  return admin.auth();
};

// For backward compatibility with existing code
export const adminDb = (typeof window === 'undefined' && admin.apps.length > 0) ? admin.firestore() : null as any;
export const adminAuth = (typeof window === 'undefined' && admin.apps.length > 0) ? admin.auth() : null as any;
