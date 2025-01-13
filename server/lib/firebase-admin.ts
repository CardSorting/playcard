import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { ServiceAccount } from 'firebase-admin';
import * as serviceAccount from '../../cred/playerstcg-bbc59-firebase-adminsdk-lzbr1-9b769a383a.json';

const typedServiceAccount = serviceAccount as ServiceAccount;

// Initialize Firebase Admin SDK
const adminApp = initializeApp({
  credential: cert(typedServiceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

export const adminAuth = getAuth(adminApp);
export const adminDb = getDatabase(adminApp);

export function getAdminDatabase() {
  return getDatabase(adminApp);
}

// Set custom claims for system role
export const setSystemRole = async (uid: string) => {
  await adminAuth.setCustomUserClaims(uid, { role: 'system' });
};

export const getSystemToken = async (uid: string) => {
  return adminAuth.createCustomToken(uid, { role: 'system' });
};
