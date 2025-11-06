// src/screens/HomeScreen.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function HomeScreen() {
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Couple-love 💜</Text>
    <Text style={{ marginTop: 8 }}>
      Coming soon: compatibility tests, a 'together' counter, distance, and check-ins.
    </Text>

      <TouchableOpacity onPress={logout} style={styles.button}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Log off</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 75, gap: 12, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  button: {
    marginTop: 24,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
});
