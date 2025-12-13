// src/utils/chat.js
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase.js'

// deterministički ID za 1-1 chat
const cid = (a, b) => [a, b].sort().join('_')

/**
 * ensureChat(meUid, otherUid)
 * vraća chatId (string).
 * Ako chat ne postoji -> kreira ga s participants = [meUid, otherUid].
 * Ako postoji -> samo dotakne updatedAt, da ispliva u listi.
 */
export async function ensureChat(meUid, otherUid) {
  if (!meUid || !otherUid) throw new Error('UID-ovi nužni')
  if (meUid === otherUid) throw new Error('Ne možeš chat sam sa sobom')

  const id = cid(meUid, otherUid)
  const ref = doc(db, 'chats', id)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [meUid, otherUid],
      lastMessage: '',
      updatedAt: serverTimestamp()
    }, { merge: false })
  } else {
    await updateDoc(ref, { updatedAt: serverTimestamp() })
  }
  return id
}

/** lista mojih chatova (za popis u docku) */
export function subscribeMyChats(meUid, cb, errCb) {
  const qy = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', meUid),
    orderBy('updatedAt', 'desc')
  )
  return onSnapshot(qy, cb, errCb)
}

/** realtime poruke jednog chata */
export function subscribeMessages(chatId, cb, errCb) {
  const qy = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(qy, cb, errCb)
}

/** slanje poruke + update chata */
export async function sendMessage(chatId, meUid, text) {
  const t = (text || '').trim()
  if (!t) return

  const messagesRef = collection(db, 'chats', chatId, 'messages')
  await addDoc(messagesRef, {
    senderId: meUid,
    text: t,
    createdAt: serverTimestamp()
  })

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: t,
    updatedAt: serverTimestamp()
  })
}
