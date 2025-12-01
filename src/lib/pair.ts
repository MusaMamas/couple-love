import { db, auth } from "../../firebaseConfig";
import {
  addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where
} from "firebase/firestore";
import testsCatalog from "../data/testsCatalog";
import { breakdownForOne } from "./score";


function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // We generate an 8-character code for greater security
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

export async function createCouple() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");
  
  const inviteCode = generateInviteCode();
  
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
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated");
  
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
  
  if (members.length !== 2) {
    throw new Error("Need 2 members to compute compatibility");
  }

  const [a, b] = members;

  const [ra, rb] = await Promise.all([
    getDoc(doc(db, "couples", coupleId, "responses", `${a}_${testId}`)),
    getDoc(doc(db, "couples", coupleId, "responses", `${b}_${testId}`)),
  ]);

  if (!ra.exists() || !rb.exists()) {
    throw new Error("Both members need to complete the test");
  }

  const userA = ra.data()?.answers || {};
  const userB = rb.data()?.answers || {};

  const test = testsCatalog.find(t => t.id === testId);
  if (!test) {
    throw new Error("Test not found");
  }

  const { score, breakdown } = breakdownForOne(test.questions, userA, userB);

  await setDoc(doc(db, "couples", coupleId, "results", testId), {
    score, 
    breakdown, 
    updatedAt: serverTimestamp()
  }, { merge: true });

  return { score, breakdown };
}
