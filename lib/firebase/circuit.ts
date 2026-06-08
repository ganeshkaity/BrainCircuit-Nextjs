import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type { CircuitChat } from "@/types/circuit";

const CHAT_COLLECTION = "circuitChats";

function chatRef(uid: string, chatId: string) {
  return doc(db, "users", uid, CHAT_COLLECTION, chatId);
}

export async function getCircuitChats(uid: string): Promise<CircuitChat[]> {
  const chatsQuery = query(
    collection(db, "users", uid, CHAT_COLLECTION),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(chatsQuery);
  return snapshot.docs.map((chatDoc) => ({
    id: chatDoc.id,
    ...(chatDoc.data() as Omit<CircuitChat, "id">),
  }));
}

export async function saveCircuitChat(uid: string, chat: CircuitChat) {
  await setDoc(
    chatRef(uid, chat.id),
    {
      ...chat,
      uid,
      updatedAt: serverTimestamp(),
      createdAt: chat.createdAt || serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteCircuitChat(uid: string, chatId: string) {
  await deleteDoc(chatRef(uid, chatId));
}

export async function deleteAllCircuitChats(uid: string) {
  const snapshot = await getDocs(collection(db, "users", uid, CHAT_COLLECTION));
  const batch = writeBatch(db);
  snapshot.docs.forEach((chatDoc) => batch.delete(chatDoc.ref));
  await batch.commit();
}
