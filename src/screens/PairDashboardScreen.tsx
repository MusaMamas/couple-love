import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { computeAndSaveCompatibility } from "../lib/pair";
import testsCatalog from "../data/testsCatalog";

type TestResult = {
  score: number;
  breakdown: Record<string, number>;
};

export default function PairDashboardScreen() {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }
    
    const unsub = onSnapshot(doc(db, "users", uid), (s) => {
      const cid = s.data()?.coupleId || null;
      setCoupleId(cid);
      
      if (cid) {
        // Subscribe to all test results
        const unsubscribes: (() => void)[] = [];
        
        testsCatalog.forEach((test) => {
          const resultUnsub = onSnapshot(
            doc(db, "couples", cid, "results", test.id),
            (r) => {
              if (r.exists()) {
                const data = r.data();
                setTestResults((prev) => ({
                  ...prev,
                  [test.id]: {
                    score: data?.score ?? 0,
                    breakdown: data?.breakdown ?? {},
                  },
                }));
              } else {
                // Remove result if it doesn't exist
                setTestResults((prev) => {
                  const newResults = { ...prev };
                  delete newResults[test.id];
                  return newResults;
                });
              }
            }
          );
          unsubscribes.push(resultUnsub);
        });
        
        return () => {
          unsubscribes.forEach((u) => u());
        };
      }
    });
    
    return unsub;
  }, []);

  const recompute = async (testId: string) => {
    if (!coupleId) return;
    
    setLoading((prev) => ({ ...prev, [testId]: true }));
    
    try {
      await computeAndSaveCompatibility(coupleId, testId);
      Alert.alert("Done", "Result updated");
    } catch (e: any) {
      Alert.alert("Could not calculate", e?.message ?? "Error");
    } finally {
      setLoading((prev) => ({ ...prev, [testId]: false }));
    }
  };

  if (!coupleId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          <Text style={styles.title}>Pair not set up</Text>
          <Text style={{ marginTop: 6, color: "#555" }}>
            Go to 'Pair Setup' to create a pair or enter by code.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.title}>Pair Dashboard</Text>
        <Text style={{ marginTop: 4, marginBottom: 16, color: "#666" }}>
          Compatibility results for each test
        </Text>

        {testsCatalog.map((test) => {
          const result = testResults[test.id];
          const isLoading = loading[test.id];
          
          return (
            <View key={test.id} style={styles.testCard}>
              <Text style={styles.testTitle}>{test.title}</Text>
              <Text style={styles.testDescription}>{test.description}</Text>
              
              {result ? (
                <>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Overall Compatibility:</Text>
                    <Text style={styles.scoreValue}>{result.score}%</Text>
                  </View>
                  
                  {Object.keys(result.breakdown).length > 0 && (
                    <View style={styles.breakdownContainer}>
                      <Text style={styles.breakdownTitle}>By Category:</Text>
                      {Object.entries(result.breakdown).map(([topic, score]) => (
                        <View key={topic} style={styles.breakdownRow}>
                          <Text style={styles.topicLabel}>{topic}:</Text>
                          <Text style={styles.topicScore}>{score}%</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.noResult}>
                  No results yet. Both partners need to complete this test.
                </Text>
              )}
              
              <TouchableOpacity
                onPress={() => recompute(test.id)}
                style={[styles.button, isLoading && styles.buttonDisabled]}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Calculating..." : result ? "Recalculate" : "Calculate"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: "#fff" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "700",
    marginTop: 8,
  },
  testCard: {
    backgroundColor: "#f7f7f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  testTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#5a67d8",
  },
  breakdownContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  topicLabel: {
    fontSize: 14,
    color: "#555",
    textTransform: "capitalize",
  },
  topicScore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5a67d8",
  },
  noResult: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#5a67d8",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
