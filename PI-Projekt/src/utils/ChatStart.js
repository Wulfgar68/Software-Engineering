import { db } from '@/firebase.js'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
} from 'firebase/firestore'

const chatIdFor = (a, b) => {
  const x = String(a || '').trim()
  const y = String(b || '').trim()
  return x < y ? `${x}_${y}` : `${y}_${x}`
}

export const startOrGetChat = async (myUid, otherUid) => {
  const id = chatIdFor(myUid, otherUid)
  const ref = doc(db, 'chats', id)

  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [myUid, otherUid],
      lastMessage: '',
      updatedAt: serverTimestamp(),
    })
  }

  return id
}

export const sendSystemMessage = async (chatId, senderId, text) => {
  const t = String(text || '').trim()
  if (!t) return

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text: t,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: t.slice(0, 120),
    updatedAt: serverTimestamp(),
  })
}
