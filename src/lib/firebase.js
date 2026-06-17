// Firebase initialization — single shared dataset for Restaurang Kopperdalen.
//
// NOT WIRED INTO THE APP YET. This file only sets up the Firebase client.
// The migration of src/lib/storage.js (onSnapshot subscribe + debounced
// setDoc) and the App.jsx wiring are the next step — see CLAUDE.md plan.
//
// Config comes from Vite env vars (.env.local, git-ignored). The web config
// is not a secret — real protection lives in Firestore security rules that
// lock the shared document to the one restaurant auth user.

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

export const app = initializeApp(firebaseConfig)

// Offline persistence: the app keeps working with no signal and syncs on
// reconnect. Single-tab manager is enough for a kitchen device.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
})

export const auth = getAuth(app)

// The one shared document every device reads and writes.
// Path: restaurant/kopperdalen  (collection / docId)
export const SHARED_COLLECTION = 'restaurant'
export const SHARED_DOC_ID = 'kopperdalen'
