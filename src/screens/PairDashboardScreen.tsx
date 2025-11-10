import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { computeAndSaveCompatibility } from "../lib/pair";

export default function PairDashboardScreen() {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid!;
    const unsub = onSnapshot(doc(db, "users", uid), (s) => {
      const cid = s.data()?.coupleId || null;
      setCoupleId(cid);
      if (cid) {
        onSnapshot(doc(db, "couples", cid, "results", "compat_v1"), (r) => {
          setScore(r.exists() ? r.data()?.score ?? null : null);
        });
      }
    });
    return unsub;
  }, []);

  const recompute = async () => {
    if (!coupleId) return;
    try {
      await computeAndSaveCompatibility(coupleId, "compat_v1");
      Alert.alert("Done", "Result updated");
    } catch (e: any) {
      Alert.alert("Could not calculate", e?.message ?? "Error");
    }
  };

  if (!coupleId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pair not set up</Text>
        <Text style={{ marginTop: 6, color: "#555" }}>
          Go to 'Pair Setup' to create a pair or enter by code.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pair Dashboard</Text>
      <Text style={{ marginTop: 8, fontSize: 16 }}>
        Compatibility (compat_v1): {score == null ? "—" : `${score}%`}
      </Text>

      <TouchableOpacity onPress={recompute} style={styles.primary}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Recalculate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  primary: { marginTop: 16, backgroundColor: "#5a67d8", padding: 14, borderRadius: 12, alignItems: "center" },
});
