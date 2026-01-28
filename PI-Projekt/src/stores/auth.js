import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth, db } from '@/firebase.js'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  serverTimestamp,
  runTransaction,
  updateDoc,
} from 'firebase/firestore'

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)

const generateBaseUsername = (firstName, lastName, email) => {
  const base =
    slugify(`${firstName} ${lastName}`) ||
    slugify((email || '').split('@')[0]) ||
    'user'
  return base || 'user'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref('')

  const initAuth = () =>
    new Promise((resolve) => {
      onAuthStateChanged(auth, (u) => {
        user.value = u || null
        loading.value = false
        resolve(u)
      })
    })

const claimUsername = async (uid, desiredUsername) => {
  const candidateBase = slugify(desiredUsername)
  if (!candidateBase) throw new Error('Neispravan username.')

  const result = await runTransaction(db, async (tx) => {
    const usersRef = doc(db, 'users', uid)
    const userSnap = await tx.get(usersRef)
    if (!userSnap.exists()) throw new Error('Korisnik ne postoji.')

    const userData = userSnap.data() || {}
    const oldLower = (userData.usernameLower || '').toLowerCase().trim()

    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? candidateBase : `${candidateBase}${i}`
      const key = candidate.toLowerCase()

      const unameRef = doc(db, 'usernames', key)
      const unameSnap = await tx.get(unameRef)

      if (!unameSnap.exists()) {
        // 🧹 obriši stari username ako postoji i ako je moj
        if (oldLower && oldLower !== key) {
          const oldRef = doc(db, 'usernames', oldLower)
          const oldSnap = await tx.get(oldRef)
          if (oldSnap.exists() && oldSnap.data()?.uid === uid) {
            tx.delete(oldRef)
          }
        }

        tx.set(unameRef, { uid, userId: uid, createdAt: serverTimestamp() })

        tx.update(usersRef, {
          username: candidate,
          usernameLower: key,
        })

        return candidate
      }
    }

    throw new Error('Username je zauzet. Probaj drugi.')
  })

  return result
}


  const ensureUsername = async (uid, firstName, lastName, email) => {
    const base = generateBaseUsername(firstName, lastName, email)
    return await claimUsername(uid, base)
  }

  const register = async (email, password, firstName, lastName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid = cred.user.uid

    await setDoc(doc(db, 'users', uid), {
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      fullName: `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim(),
      displayNameLower: `${firstName} ${lastName}`.toLowerCase().trim(),
      email: cred.user.email,
      username: null,
      usernameLower: null,
      isPremium: false,
      createdAt: serverTimestamp(),
    })

    await ensureUsername(uid, firstName, lastName, cred.user.email)

    user.value = cred.user
    return cred.user
  }

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    user.value = cred.user
    return cred.user
  }

  const logout = async () => {
    error.value = ''
    try {
      await signOut(auth)
      user.value = null
    } catch (e) {
      error.value = e?.message || 'Greška pri odjavi.'
      throw e
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    error.value = ''
    if (!auth.currentUser) throw new Error('Niste prijavljeni.')

    const email = auth.currentUser.email
    if (!email) throw new Error('Nedostaje email na korisniku.')

    const cred = EmailAuthProvider.credential(email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, cred)
    await updatePassword(auth.currentUser, newPassword)
    return true
  }

  const sendPasswordReset = async (email) => {
    await sendPasswordResetEmail(auth, email)
    return true
  }

  const setDisplayNameLower = async (uid, firstName, lastName) => {
    await updateDoc(doc(db, 'users', uid), {
      displayNameLower: `${firstName} ${lastName}`.toLowerCase().trim(),
    })
  }

  return {
    user,
    loading,
    error,
    initAuth,
    register,
    login,
    logout,
    changePassword,
    sendPasswordReset,

    claimUsername,
    setDisplayNameLower,
  }
})
