import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { doc, onSnapshot } from "firebase/firestore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function calculateTimeTogether(startDate: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  
  // Calculate total days
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Calculate years, months, days
  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const days = remainingDaysAfterYears % 30;
  
  const parts: string[] = [];
  
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  
  return parts.join(', ');
}

export default function HomeScreen() {
  const nav = useNavigation<NavigationProp>();
  const [relationshipDuration, setRelationshipDuration] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const unsub = onSnapshot(doc(db, "users", uid), (userSnap) => {
      const cid = userSnap.data()?.coupleId || null;
      setCoupleId(cid);
      
      if (cid) {
        // Subscribe to couple data to get start date
        const coupleUnsub = onSnapshot(doc(db, "couples", cid), (coupleSnap) => {
          if (coupleSnap.exists()) {
            const data = coupleSnap.data();
            if (data?.startDate?.toDate) {
              const startDate = data.startDate.toDate();
              const duration = calculateTimeTogether(startDate);
              setRelationshipDuration(duration);
            }
          }
        });
        
        return coupleUnsub;
      } else {
        setRelationshipDuration(null);
      }
    });
    
    return unsub;
  }, []);

  // Update duration every hour
  useEffect(() => {
    if (!relationshipDuration) return;
    
    const interval = setInterval(() => {
      // Trigger re-fetch by updating a dummy state
      // This will cause the snapshot listener to recalculate
      const uid = auth.currentUser?.uid;
      if (uid && coupleId) {
        onSnapshot(doc(db, "couples", coupleId), (coupleSnap) => {
          if (coupleSnap.exists()) {
            const data = coupleSnap.data();
            if (data?.startDate?.toDate) {
              const startDate = data.startDate.toDate();
              const duration = calculateTimeTogether(startDate);
              setRelationshipDuration(duration);
            }
          }
        });
      }
    }, 3600000); // Update every hour
    
    return () => clearInterval(interval);
  }, [relationshipDuration, coupleId]);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to Couple-love 💜</Text>
          
          {relationshipDuration && (
            <View style={styles.durationCard}>
              <Text style={styles.durationLabel}>Together for</Text>
              <Text style={styles.durationValue}>{relationshipDuration}</Text>
            </View>
          )}
          
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
    marginBottom: 8,
  },
  durationCard: {
    backgroundColor: "#f0f0ff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    minWidth: 250,
    borderWidth: 2,
    borderColor: "#e0e0ff",
  },
  durationLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 20,
    color: "#5a67d8",
    fontWeight: "700",
    textAlign: "center",
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
