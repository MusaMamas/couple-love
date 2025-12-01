import { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createCouple, joinCoupleByCode, updateRelationshipStartDate } from "../lib/pair";
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

export default function PairOnboardingScreen() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [currentStartDate, setCurrentStartDate] = useState<Date | null>(null);
  
  const swap = () => setMode(m => m === "create" ? "join" : "create");

  // Load couple data
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const unsub = onSnapshot(doc(db, "users", uid), (userSnap) => {
      const cid = userSnap.data()?.coupleId || null;
      setCoupleId(cid);
      
      if (cid) {
        // Subscribe to couple data
        const coupleUnsub = onSnapshot(doc(db, "couples", cid), (coupleSnap) => {
          if (coupleSnap.exists()) {
            const data = coupleSnap.data();
            if (data?.startDate?.toDate) {
              const date = data.startDate.toDate();
              setCurrentStartDate(date);
              // Format as YYYY-MM-DD for input
              const formatted = date.toISOString().split('T')[0];
              setStartDate(formatted);
            }
          }
        });
        
        return coupleUnsub;
      }
    });
    
    return unsub;
  }, []);

  const onCreate = async () => {
    try {
      setBusy(true);
      const { inviteCode } = await createCouple();
      Alert.alert("Couple created", `Invitation code: ${inviteCode}\nSend it to your partner.`);
    } catch (e: any) { 
      Alert.alert("Error", e?.message ?? "Failed to create couple"); 
    } finally { 
      setBusy(false); 
    }
  };

  const onJoin = async () => {
    if (!code.trim()) {
      Alert.alert("Please enter invitation code");
      return;
    }
    try {
      setBusy(true);
      await joinCoupleByCode(code.trim());
      Alert.alert("Done", "Successfully joined the couple");
    } catch (e: any) { 
      Alert.alert("Error", e?.message ?? "Failed to join couple"); 
    } finally { 
      setBusy(false); 
    }
  };

  const onUpdateDate = async () => {
    if (!coupleId) {
      Alert.alert("Error", "No couple found");
      return;
    }
    
    if (!startDate.trim()) {
      Alert.alert("Error", "Please enter a date");
      return;
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      Alert.alert("Error", "Please use format: YYYY-MM-DD (e.g., 2024-01-15)");
      return;
    }
    
    try {
      setBusy(true);
      const date = new Date(startDate + 'T00:00:00');
      
      if (isNaN(date.getTime())) {
        Alert.alert("Error", "Invalid date");
        return;
      }
      
      await updateRelationshipStartDate(coupleId, date);
      Alert.alert("Success", "Relationship start date updated!");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to update date");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.title}>Couple Settings</Text>
          
          {!coupleId ? (
            <>
              <Text style={styles.subtitle}>
                {mode === "create"
                  ? "Create an invitation code to share with your partner."
                  : "Enter the invitation code."}
              </Text>

              {mode === "create" ? (
                <TouchableOpacity 
                  disabled={busy} 
                  onPress={onCreate} 
                  style={[styles.primary, busy && { opacity: 0.6 }]}
                >
                  <Text style={styles.btnText}>
                    {busy ? "Creating..." : "Create Couple"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    placeholder="Invitation Code"
                    autoCapitalize="characters"
                    value={code}
                    onChangeText={setCode}
                    style={styles.input}
                  />
                  <TouchableOpacity 
                    disabled={busy} 
                    onPress={onJoin} 
                    style={[styles.primary, busy && { opacity: 0.6 }]}
                  >
                    <Text style={styles.btnText}>
                      {busy ? "Connecting..." : "Join by Code"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={swap} style={{ marginTop: 14 }}>
                <Text style={{ color: "#5a67d8", fontWeight: "600", textAlign: "center" }}>
                  {mode === "create" ? "I have a code" : "I don't have a code"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Manage your couple settings
              </Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Relationship Start Date</Text>
                <Text style={styles.sectionSubtitle}>
                  This date will be displayed on the home screen
                </Text>
                
                {currentStartDate && (
                  <Text style={styles.currentDate}>
                    Current: {currentStartDate.toLocaleDateString('fi-FI', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                )}
                
                <TextInput
                  placeholder="YYYY-MM-DD (e.g., 2024-01-15)"
                  value={startDate}
                  onChangeText={setStartDate}
                  style={styles.input}
                  keyboardType="numbers-and-punctuation"
                />
                
                <TouchableOpacity 
                  disabled={busy} 
                  onPress={onUpdateDate} 
                  style={[styles.primary, busy && { opacity: 0.6 }]}
                >
                  <Text style={styles.btnText}>
                    {busy ? "Updating..." : "Update Date"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ℹ️ Both partners can update this date. Changes sync automatically.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 24, 
    backgroundColor: "#fff" 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: { 
    color: "#555", 
    marginTop: 6,
    marginBottom: 16,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  currentDate: {
    fontSize: 15,
    color: "#5a67d8",
    fontWeight: "600",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0ff",
    borderRadius: 8,
  },
  input: { 
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1, 
    borderColor: "#e5e7eb", 
    borderRadius: 12, 
    padding: 12, 
    backgroundColor: "#fff",
    fontSize: 15,
  },
  primary: { 
    marginTop: 8, 
    backgroundColor: "#5a67d8", 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center" 
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 16,
  },
  infoBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#f7f7f8",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#5a67d8",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
});
