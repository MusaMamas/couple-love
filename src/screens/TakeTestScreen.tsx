import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import testsCatalog from "../data/testsCatalog";
import type { Question } from "../data/testsCatalog";
import { db, auth } from "../../firebaseConfig";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";

type Props = { route: { params: { testId: string } } };

function Likert({
  value,
  onChange,
  labels = ["1", "5"],
}: {
  value?: number;
  onChange: (v: number) => void;
  labels?: [string, string];
}) {
  const options = [1, 2, 3, 4, 5] as const;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ opacity: 0.6 }}>{labels[0]}</Text>
        <Text style={{ opacity: 0.6 }}>{labels[1]}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "space-between" }}>
        {options.map((o) => (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(o)}
            style={[
              styles.chip,
              value === o && { backgroundColor: "#5a67d8" },
            ]}
          >
            <Text style={[styles.chipText, value === o && { color: "#fff" }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function TakeTestScreen({ route }: Props) {
  const { testId } = route.params;
  const test = useMemo(
    () => testsCatalog.find((t) => t.id === testId)!,
    [testId]
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  useMemo(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = doc(db, "users", uid, "responses", testId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const prev = snap.data()?.answers || {};
        setAnswers(prev);
      }
    })();
  }, [testId]);

  const set = (qid: string, v: number) =>
    setAnswers((s) => ({ ...s, [qid]: v }));

  const submit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Virhe", "Käyttäjää ei löytynyt");
      return;
    }
    // Tavallinen tarkistus, että kaikkiin kysymyksiin on vastattu
    const allAnswered = test.questions.every((q) => answers[q.id] != null);
    if (!allAnswered) {
      Alert.alert("Täytä kaikki kysymykset");
      return;
    }
    try {
      setBusy(true);
      await setDoc(
        doc(db, "users", uid, "responses", testId),
        {
          answers,
          submittedAt: serverTimestamp(),
          version: 1,
        },
        { merge: true }
      );
        const uref = doc(db, "users", uid);
        const usnap = await getDoc(uref);
        const coupleId = usnap.data()?.coupleId as string | undefined;

      if (coupleId) {
        await setDoc(
          doc(db, "couples", coupleId, "responses", `${uid}_${testId}`),
          { answers, submittedAt: serverTimestamp(), uid, testId },
          { merge: true }
        );
      }
      Alert.alert("Valmis", "Vastaukset tallennettu! Laskemme parin tuloksen myöhemmin.");
    } catch (e: any) {
      Alert.alert("Tallennus epäonnistui", e?.message ?? "Virhe");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>{test.title}</Text>
      <Text style={{ color: "#555", marginBottom: 12 }}>{test.description}</Text>

      {test.questions.map((q: Question, idx) => (
        <View key={q.id} style={styles.block}>
          <Text style={styles.qIndex}>{idx + 1}.</Text>
          <View style={{ flex: 1, gap: 10 }}>
            <Text style={styles.qText}>{q.text}</Text>
            <Likert
              value={answers[q.id]}
              onChange={(v) => set(q.id, v)}
              labels={q.labels}
            />
          </View>
        </View>
      ))}

      <TouchableOpacity disabled={busy} onPress={submit} style={styles.button}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {busy ? "Tallennetaan..." : "Tallenna vastaukset"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, paddingTop: 42 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  block: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#f7f7f8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  qIndex: { fontWeight: "700", width: 22, textAlign: "right", marginTop: 2 },
  qText: { fontSize: 15 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#e8e8ff",
    minWidth: 44,
    alignItems: "center",
  },
  chipText: { fontWeight: "600" },
  button: {
    marginTop: 6,
    backgroundColor: "#5a67d8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});