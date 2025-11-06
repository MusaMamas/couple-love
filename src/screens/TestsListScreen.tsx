import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import testsCatalog from "../data/testsCatalog";
import { useNavigation } from "@react-navigation/native";

export default function TestsListScreen() {
  const nav = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tests</Text>
      <FlatList
        data={testsCatalog}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate("TakeTest", { testId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <Text style={styles.link}>Pass test</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", alignItems: "center", marginTop: 36 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center", width: "100%" },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f7f7f8",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardDesc: { marginTop: 6, color: "#555" },
  link: { marginTop: 10, fontWeight: "600", color: "#5a67d8" },
});