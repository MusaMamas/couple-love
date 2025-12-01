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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // only for signup
  const [busy, setBusy] = useState(false);

  const swap = () => setMode((m) => (m === "login" ? "signup" : "login"));

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/invalid-email":
        return "Invalid password, try again";
      case "auth/user-not-found":
        return "User not found";
      case "auth/email-already-in-use":
        return "Email already in use";
      case "auth/weak-password":
        return "Password is too weak";
      case "auth/too-many-requests":
        return "Too many attempts, try again later";
      case "auth/network-request-failed":
        return "Network error, check your connection";
      default:
        return "Operation failed, try again";
    }
  };

  // FIXED: Added email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async () => {
    if (!email || !password || (mode === "signup" && !name)) {
      Alert.alert("Please fill all fields");
      return;
    }
    
    // FIXED: Email format checking
    if (!validateEmail(email.trim())) {
      Alert.alert("Invalid email format");
      return;
    }
    
    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return;
    }
    
    try {
      setBusy(true);
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        // save display name (shown later in profile)
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (e: any) {
      const errorMessage = getErrorMessage(e?.code);
      Alert.alert("Error", errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Couple-love</Text>
          <Text style={styles.subtitle}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Text>

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, busy && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={busy}
          >
            <Text style={styles.buttonText}>
              {busy ? "Loading..." : (mode === "login" ? "Sign In" : "Sign Up")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={swap} style={{ marginTop: 12 }}>
            <Text style={{ textAlign: "center" }}>
              {mode === "login"
                ? "No account? Sign up"
                : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>
          By continuing, you agree to our data processing. We'll add separate consent options and a privacy policy later.
        </Text>
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
    backgroundColor: "#fff", 
    gap: 12 
  },
  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#f7f7f8",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 16, 
    opacity: 0.7, 
    textAlign: "center", 
    marginTop: 6 
  },
  input: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e2e6",
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#5a67d8",
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  footnote: { 
    textAlign: "center", 
    fontSize: 12, 
    color: "#7a7a7a" 
  },
});
