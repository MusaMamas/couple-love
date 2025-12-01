import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import testsCatalog from "../data/testsCatalog";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

// FIXED: Navigation typing
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TestsListScreen() {
  const nav = useNavigation<NavigationProp>();
  
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Tests</Text>
        <FlatList
          data={testsCatalog}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "#555", textAlign: "center" }}>
                No tests available yet
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate("TakeTest", { testId: item.id })}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.link}>Take Test</Text>
            </TouchableOpacity>
          )}
        />
      </View>
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
    backgroundColor: "#fff", 
    alignItems: "center" 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 16,
    marginTop: 8,
    textAlign: "center", 
    width: "100%" 
  },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f7f7f8",
    marginBottom: 12,
    width: "100%",
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "600" 
  },
  cardDesc: { 
    marginTop: 6, 
    color: "#555",
    flexWrap: "wrap",
  },
  link: { 
    marginTop: 10, 
    fontWeight: "600", 
    color: "#5a67d8" 
  },
});