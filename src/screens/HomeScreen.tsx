import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const logout = async () => {
    await signOut(auth);
  };

  const nav = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Couple-love 💜</Text>
      <TouchableOpacity onPress={() => nav.navigate("TestsList")} style={styles.primary}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>To test</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={logout} style={styles.danger}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Exit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:24, gap:12, backgroundColor:"#fff", justifyContent:"center", alignItems:"center"},
  title:{ fontSize:22, fontWeight:"700"},
  primary:{ marginTop:12, backgroundColor:"#5a67d8", padding:12, borderRadius:10, minWidth:120, alignItems:"center"},
  danger:{ marginTop:8, backgroundColor:"#ef4444", padding:12, borderRadius:10, minWidth:120, alignItems:"center"},
});