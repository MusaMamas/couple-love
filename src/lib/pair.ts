import { db, auth } from "../../firebaseConfig";
import {
  addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where
} from "firebase/firestore";
import testsCatalog from "../data/testsCatalog";
import { breakdownForOne } from "./score";

export async function createCouple() {
  const uid = auth.currentUser?.uid!;
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase(); // 6 symbols
  const ref = await addDoc(collection(db, "couples"), {
    members: [uid],
    createdAt: serverTimestamp(),
    startDate: serverTimestamp(),
    inviteCode,
  });
  await setDoc(doc(db, "users", uid), { coupleId: ref.id }, { merge: true });
  return { coupleId: ref.id, inviteCode };
}

export async function joinCoupleByCode(code: string) {
  const uid = auth.currentUser?.uid!;
  const q = query(collection(db, "couples"), where("inviteCode", "==", code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Couple with this code not found");
  const cdoc = snap.docs[0];
  const data = cdoc.data() as any;
  const members: string[] = data.members || [];
  if (members.includes(uid)) {
    await setDoc(doc(db, "users", uid), { coupleId: cdoc.id }, { merge: true });
    return { coupleId: cdoc.id };
  }
  if (members.length >= 2) throw new Error("This couple already has 2 members");
  await updateDoc(cdoc.ref, { members: [...members, uid] });
  await setDoc(doc(db, "users", uid), { coupleId: cdoc.id }, { merge: true });
  return { coupleId: cdoc.id };
}

export async function computeAndSaveCompatibility(coupleId: string, testId: string) {
  const cr = doc(db, "couples", coupleId);
  const cs = await getDoc(cr);
  const members: string[] = (cs.data()?.members || []);
  if (members.length !== 2) throw new Error("Need 2 members to compute compatibility");

  const [a, b] = members;

  const [ra, rb] = await Promise.all([
    getDoc(doc(db, "couples", coupleId, "responses", `${a}_${testId}`)),
    getDoc(doc(db, "couples", coupleId, "responses", `${b}_${testId}`)),
  ]);

  if (!ra.exists() || !rb.exists()) throw new Error("Не у обоих есть ответы");

  const userA = ra.data()?.answers || {};
  const userB = rb.data()?.answers || {};

  const test = testsCatalog.find(t => t.id === testId)!;
  const { score, breakdown } = breakdownForOne(test.questions, userA, userB);

  await setDoc(doc(db, "couples", coupleId, "results", testId), {
    score, breakdown, updatedAt: serverTimestamp()
  }, { merge: true });

  return { score, breakdown };
}