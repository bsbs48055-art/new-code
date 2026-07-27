import { initializeApp, type FirebaseApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { loadSecureKeys } from '@/services/storage';
import type { UserProfile } from '@/types';

let app: FirebaseApp | null = null;

export async function initFirebase(): Promise<FirebaseApp | null> {
  const keys = await loadSecureKeys();
  if (!keys.firebaseApiKey || !keys.firebaseAuthDomain || !keys.firebaseProjectId || !keys.firebaseAppId) {
    return null;
  }

  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  app = initializeApp({
    apiKey: keys.firebaseApiKey,
    authDomain: keys.firebaseAuthDomain,
    projectId: keys.firebaseProjectId,
    appId: keys.firebaseAppId,
  });
  return app;
}

function toProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Creator',
    photoURL: user.photoURL ?? undefined,
    provider: user.providerData[0]?.providerId ?? 'password',
  };
}

export async function getFirebaseAuth() {
  const firebaseApp = await initFirebase();
  if (!firebaseApp) return null;
  return getAuth(firebaseApp);
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const auth = await getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured. Add your Firebase keys in Settings.');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return toProfile(result.user);
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const auth = await getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured. Add your Firebase keys in Settings.');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return toProfile(result.user);
}

export async function registerWithEmail(email: string, password: string): Promise<UserProfile> {
  const auth = await getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured. Add your Firebase keys in Settings.');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return toProfile(result.user);
}

export async function logoutFirebase(): Promise<void> {
  const auth = await getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export async function subscribeAuth(callback: (user: UserProfile | null) => void): Promise<() => void> {
  const auth = await getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, (user) => callback(user ? toProfile(user) : null));
}
