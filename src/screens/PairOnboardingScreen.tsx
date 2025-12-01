import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createCouple, joinCoupleByCode } from "../lib/pair";

export default function PairOnboardingScreen() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const swap = () => setMode(m => m === "create" ? "join" : "create");

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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>Create Couple</Text>
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
    marginTop: 6 
  },
  input: { 
    marginTop: 16, 
    borderWidth: 1, 
    borderColor: "#e5e7eb", 
    borderRadius: 12, 
    padding: 12, 
    backgroundColor: "#fff" 
  },
  primary: { 
    marginTop: 16, 
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
});
