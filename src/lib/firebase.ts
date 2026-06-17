// Firebase initialization — single shared dataset for Restaurang Kopperdalen.
//
// Config comes from Vite env vars (.env.local, git-ignored). The web config
// is not a secret — real protection lives in the Firestore security rules
// (firestore.rules) that lock the shared document to the one restaurant user.
//
// When the env vars are absent the app runs in local-only mode (no cloud,
// no login) — see isFirebaseConfigured.

import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// True once .env.local is filled in. Until then the app stays local-only.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : undefined

// Offline persistence: the app keeps working with no signal and syncs on
// reconnect. Single-tab manager is enough for a kitchen device.
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }),
    })
  : undefined

export const auth = app ? getAuth(app) : undefined

// The one shared document every device reads and writes (restaurant/kopperdalen).
export const SHARED_COLLECTION = 'restaurant'
export const SHARED_DOC_ID = 'kopperdalen'
