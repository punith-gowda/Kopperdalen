// One-time seed: upload src/data/recipes.json into the Firestore `recipes`
// collection. Run locally once, after creating the shared user:
//
//   npm run seed -- you@example.com 'the-password'
//   (or set SEED_EMAIL / SEED_PASSWORD env vars)
//
// Refuses to run if the collection already has recipes, unless you pass
// --force. The app never imports recipes.json — this script is the only
// thing that reads it.
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  collection, doc, getDocs, getFirestore, limit, query, writeBatch,
} from 'firebase/firestore'

const root = new URL('..', import.meta.url)

// --- read VITE_FIREBASE_* from .env.local ---
const env = Object.fromEntries(
  readFileSync(new URL('.env.local', root), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const force = process.argv.includes('--force')
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const email = args[0] || process.env.SEED_EMAIL
const password = args[1] || process.env.SEED_PASSWORD

if (!firebaseConfig.apiKey) {
  console.error('✖ Missing Firebase config — fill in .env.local first.')
  process.exit(1)
}
if (!email || !password) {
  console.error('Usage: npm run seed -- <email> <password>   (the shared restaurant account)')
  process.exit(1)
}

const recipes = JSON.parse(readFileSync(new URL('src/data/recipes.json', root), 'utf8'))

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

try {
  await signInWithEmailAndPassword(auth, email, password)
  console.log('✓ Signed in as', email)

  const existing = await getDocs(query(collection(db, 'recipes'), limit(1)))
  if (!existing.empty && !force) {
    console.error('✖ recipes collection is not empty. Re-run with --force to overwrite.')
    process.exit(1)
  }

  const batch = writeBatch(db)
  for (const r of recipes) {
    const { id, custom, ...fields } = r // drop the numeric id (becomes doc id) and custom flag
    void custom
    batch.set(doc(db, 'recipes', String(id)), fields)
  }
  await batch.commit()
  console.log(`✓ Seeded ${recipes.length} recipes into 'recipes' collection.`)
  process.exit(0)
} catch (e) {
  console.error('✖ Seed failed:', e?.code || e?.message || e)
  process.exit(1)
}
