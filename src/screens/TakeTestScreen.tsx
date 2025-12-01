import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

function Choice({
  value,
  onChange,
  options,
}: {
  value?: number;
  onChange: (v: number) => void;
  options: [string, string];
}) {
  return (
    <View style={{ gap: 10 }}>
      <TouchableOpacity
        onPress={() => onChange(1)}
        style={[
          styles.choiceButton,
          value === 1 && styles.choiceButtonSelected,
        ]}
      >
        <Text style={[
          styles.choiceText,
          value === 1 && styles.choiceTextSelected
        ]}>
          {options[0]}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(2)}
        style={[
          styles.choiceButton,
          value === 2 && styles.choiceButtonSelected,
        ]}
      >
        <Text style={[
          styles.choiceText,
          value === 2 && styles.choiceTextSelected
        ]}>
          {options[1]}
        </Text>
      </TouchableOpacity>
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

  // FIXED: useEffect instead of useMemo for side effects
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      
      try {
        const ref = doc(db, "users", uid, "responses", testId);
        const snap = await getDoc(ref);
        
        if (snap.exists() && isMounted) {
          const prev = snap.data()?.answers || {};
          setAnswers(prev);
        }
      } catch (error) {
        console.error("Error loading previous answers:", error);
      }
    })();

    // Cleanup function to prevent race condition
    return () => {
      isMounted = false;
    };
  }, [testId]);

  const set = (qid: string, v: number) =>
    setAnswers((s) => ({ ...s, [qid]: v }));

  const submit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Error", "User not found");
      return;
    }
    
    // Checking that all questions have been answered
    const allAnswered = test.questions.every((q) => answers[q.id] != null);
    if (!allAnswered) {
      Alert.alert("Please answer all questions");
      return;
    }
    
    try {
      setBusy(true);
      
      // Saving user responses
      await setDoc(
        doc(db, "users", uid, "responses", testId),
        {
          answers,
          submittedAt: serverTimestamp(),
          version: 1,
        },
        { merge: true }
      );
      
      // If the user is in a couple, save answers in couples
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
      
      Alert.alert("Done", "Your answers have been saved! We will calculate couple compatibility later.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.title}>{test.title}</Text>
        <Text style={{ color: "#555", marginBottom: 12 }}>{test.description}</Text>

        {test.questions.map((q: Question, idx) => (
          <View key={q.id} style={styles.block}>
            <Text style={styles.qIndex}>{idx + 1}.</Text>
            <View style={{ flex: 1, gap: 10 }}>
              <Text style={styles.qText}>{q.text}</Text>
              {q.type === "likert5" ? (
                <Likert
                  value={answers[q.id]}
                  onChange={(v) => set(q.id, v)}
                  labels={q.labels}
                />
              ) : q.type === "choice" && q.options ? (
                <Choice
                  value={answers[q.id]}
                  onChange={(v) => set(q.id, v)}
                  options={q.options}
                />
              ) : null}
            </View>
          </View>
        ))}

        <TouchableOpacity disabled={busy} onPress={submit} style={styles.button}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {busy ? "Saving..." : "Save answers"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 16 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 8,
    marginTop: 8,
  },
  block: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#f7f7f8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  qIndex: { 
    fontWeight: "700", 
    width: 22, 
    textAlign: "right", 
    marginTop: 2 
  },
  qText: { 
    fontSize: 15,
    flexWrap: "wrap",
    flexShrink: 1,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#e8e8ff",
    minWidth: 40,
    maxWidth: 60,
    alignItems: "center",
  },
  chipText: { fontWeight: "600" },
  choiceButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#e8e8ff",
    borderWidth: 2,
    borderColor: "transparent",
  },
  choiceButtonSelected: {
    backgroundColor: "#5a67d8",
    borderColor: "#5a67d8",
  },
  choiceText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  choiceTextSelected: {
    color: "#fff",
  },
  button: {
    marginTop: 6,
    backgroundColor: "#5a67d8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});