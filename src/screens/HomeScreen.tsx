import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

// FIXED: Navigation typing
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<NavigationProp>();

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to Couple-love 💜</Text>
          
          <TouchableOpacity 
            onPress={() => nav.navigate("TestsList")} 
            style={styles.primary}
          >
            <Text style={styles.buttonText}>Take Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => nav.navigate("PairSetup")} 
            style={styles.primary}
          >
            <Text style={styles.buttonText}>Couple Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => nav.navigate("PairDashboard")} 
            style={styles.primary}
          >
            <Text style={styles.buttonText}>Couple Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={logout} 
            style={styles.danger}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: { 
    flex: 1, 
    padding: 24, 
    gap: 12, 
    backgroundColor: "#fff", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700",
    marginBottom: 16,
  },
  primary: { 
    marginTop: 8, 
    backgroundColor: "#5a67d8", 
    padding: 14, 
    borderRadius: 10, 
    minWidth: 200, 
    alignItems: "center" 
  },
  danger: { 
    marginTop: 16, 
    backgroundColor: "#ef4444", 
    padding: 14, 
    borderRadius: 10, 
    minWidth: 200, 
    alignItems: "center" 
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 16,
  },
});
