// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth, db } from '@/firebase.js'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  // ⬇️ za promjenu lozinke / reset
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)         // Firebase Auth user (ili null)
  const loading = ref(true)      // global auth loading (opcionalno)
  const error = ref('')          // zadnja greška (opcionalno)

  // Pozovi jednom pri startu app-a (npr. u App.vue onMounted)
  const initAuth = () =>
    new Promise((resolve) => {
      onAuthStateChanged(auth, (u) => {
        user.value = u || null
        loading.value = false
        resolve(u)
      })
    })

  // Registracija + kreiranje profila u /users/{uid}
  const register = async (email, password, firstName, lastName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid = cred.user.uid

    // Spremi korisnički profil
    await setDoc(doc(db, 'users', uid), {
      firstName: (firstName || '').trim(),
      lastName : (lastName  || '').trim(),
      fullName : `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim(),
      email    : cred.user.email,
      username : null, // kasnije korisnik može postaviti
      createdAt: serverTimestamp(),
    })

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
      user.value = null // onAuthStateChanged će ionako postaviti null
      // console.log('Odjava OK')
    } catch (e) {
      error.value = e?.message || 'Greška pri odjavi.'
      throw e
    }
  }

  // ✅ PROMJENA LOZINKE (reauth + update)
  const changePassword = async (currentPassword, newPassword) => {
    error.value = ''
    if (!auth.currentUser) throw new Error('Niste prijavljeni.')

    const email = auth.currentUser.email
    if (!email) throw new Error('Nedostaje email na korisniku.')

    // reauth sa starom lozinkom
    const cred = EmailAuthProvider.credential(email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, cred)

    // update lozinke
    await updatePassword(auth.currentUser, newPassword)
    return true
  }

  // ✅ SLANJE RESET EMAILA
  const sendPasswordReset = async (email) => {
    await sendPasswordResetEmail(auth, email)
    return true
  }

  return {
    // state
    user,
    loading,
    error,
    // actions
    initAuth,
    register,
    login,
    logout,
    changePassword,
    sendPasswordReset,
  }
})
