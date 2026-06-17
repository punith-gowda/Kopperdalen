// Firestore sync + auth for the single shared dataset.
// All Firebase APIs are reached only through this module so the rest of the
// app stays storage-agnostic.
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { SHARED_COLLECTION, SHARED_DOC_ID, auth, db } from './firebase'
import { normalizeData } from './storage'
import type { AppData, Recipe, RecipeDoc, RecipeId } from '../types'

export type { User }

const RECIPES_COLLECTION = 'recipes'
const docRef = () => doc(db!, SHARED_COLLECTION, SHARED_DOC_ID)

// ---- Auth (single shared restaurant account) ----

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth!, cb)
}

export async function signIn(email: string, password: string): Promise<void> {
  // Keep the session on this device so the 50+ user logs in only once.
  await setPersistence(auth!, browserLocalPersistence)
  await signInWithEmailAndPassword(auth!, email.trim(), password)
}

export function signOutUser(): Promise<void> {
  return signOut(auth!)
}

// ---- Firestore document sync ----

export interface CloudSnapshot {
  exists: boolean
  data: AppData
  /** false while this device's own optimistic write is still pending. */
  fromServer: boolean
}

export function subscribe(onChange: (snap: CloudSnapshot) => void): () => void {
  return onSnapshot(docRef(), (snap) => {
    onChange({
      exists: snap.exists(),
      data: normalizeData((snap.data() as Partial<AppData>) || {}),
      fromServer: !snap.metadata.hasPendingWrites,
    })
  })
}

let timer: ReturnType<typeof setTimeout> | null = null
/** Debounced write of the whole document (last-write-wins). */
export function pushData(data: AppData): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    setDoc(docRef(), { ...data, updatedAt: serverTimestamp() }).catch(() => {
      /* offline — the persistent cache queues the write and syncs later */
    })
  }, 500)
}

// ---- Recipes collection (one document per recipe) ----

/** Live subscription to the whole catalogue. */
export function subscribeRecipes(onChange: (recipes: Recipe[]) => void): () => void {
  return onSnapshot(collection(db!, RECIPES_COLLECTION), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as RecipeDoc) })))
  })
}

/** Create or overwrite a single recipe (the id is the document id). */
export function upsertRecipe(recipe: Recipe): Promise<void> {
  const { id, ...fields } = recipe
  return setDoc(doc(db!, RECIPES_COLLECTION, id), fields)
}

export function removeRecipe(id: RecipeId): Promise<void> {
  return deleteDoc(doc(db!, RECIPES_COLLECTION, id))
}
