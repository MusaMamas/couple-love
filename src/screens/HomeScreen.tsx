import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import * as Location from 'expo-location';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function calculateTimeTogether(startDate: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return "So close! 💜";
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
}

export default function HomeScreen() {
  const nav = useNavigation<NavigationProp>();
  const [relationshipDuration, setRelationshipDuration] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [showMode, setShowMode] = useState<'duration' | 'distance'>('duration');
  const [distance, setDistance] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [myLocation, setMyLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // Request location permission and start tracking
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
      }
    })();
  }, []);

  // Track current user's location
  useEffect(() => {
    if (!locationPermission || !coupleId) return;

    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      // Watch position
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 50, // Or when moved 50 meters
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          setMyLocation({ latitude, longitude });

          // Update location in Firestore
          try {
            await updateDoc(doc(db, "users", uid), {
              location: {
                latitude,
                longitude,
                updatedAt: new Date(),
              }
            });
          } catch (error) {
            console.error("Error updating location:", error);
          }
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationPermission, coupleId]);

  // Subscribe to couple data and partner's location
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
            
            // Get relationship duration
            if (data?.startDate?.toDate) {
              const startDate = data.startDate.toDate();
              const duration = calculateTimeTogether(startDate);
              setRelationshipDuration(duration);
            }

            // Get partner's ID and subscribe to their location
            const members: string[] = data.members || [];
            const partnerId = members.find(id => id !== uid);
            
            if (partnerId) {
              // Subscribe to partner's location
              const partnerUnsub = onSnapshot(doc(db, "users", partnerId), (partnerSnap) => {
                if (partnerSnap.exists()) {
                  const partnerData = partnerSnap.data();
                  if (partnerData?.location) {
                    setPartnerLocation({
                      latitude: partnerData.location.latitude,
                      longitude: partnerData.location.longitude,
                    });
                  }
                }
              });
              
              return partnerUnsub;
            }
          }
        });
        
        return coupleUnsub;
      } else {
        setRelationshipDuration(null);
        setPartnerLocation(null);
      }
    });
    
    return unsub;
  }, []);

  // Calculate distance when both locations are available
  useEffect(() => {
    if (myLocation && partnerLocation) {
      const dist = calculateDistance(
        myLocation.latitude,
        myLocation.longitude,
        partnerLocation.latitude,
        partnerLocation.longitude
      );
      setDistance(formatDistance(dist));
    } else {
      setDistance(null);
    }
  }, [myLocation, partnerLocation]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationPermission(true);
      Alert.alert("Permission granted", "Location tracking enabled!");
    } else {
      Alert.alert("Permission denied", "Cannot track distance without location permission.");
    }
  };

  const toggleMode = () => {
    if (showMode === 'duration') {
      if (!locationPermission) {
        Alert.alert(
          "Location Permission Required",
          "To see distance between you and your partner, we need access to your location.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Enable", onPress: requestLocationPermission }
          ]
        );
      } else {
        setShowMode('distance');
      }
    } else {
      setShowMode('duration');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to Couple-love 💜</Text>
          
          {(relationshipDuration || (locationPermission && distance)) && (
            <>
              <View style={styles.durationCard}>
                {showMode === 'duration' && relationshipDuration ? (
                  <>
                    <Text style={styles.durationLabel}>Together for</Text>
                    <Text style={styles.durationValue}>{relationshipDuration}</Text>
                  </>
                ) : showMode === 'distance' ? (
                  <>
                    <Text style={styles.durationLabel}>Distance</Text>
                    <Text style={styles.durationValue}>
                      {distance || "Locating..."}
                    </Text>
                  </>
                ) : null}
              </View>

              <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
                <Text style={styles.toggleButtonText}>
                  {showMode === 'duration' 
                    ? '📍 Show Distance' 
                    : '⏱️ Show Duration'}
                </Text>
              </TouchableOpacity>
            </>
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
            onPress={() => nav.navigate("MemoryMap")} 
            style={styles.primary}
          >
            <Text style={styles.buttonText}>Our Memories 🗺️</Text>
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
    marginBottom: 8,
    minWidth: 250,
    borderWidth: 2,
    borderColor: "#e0e0ff",
    minHeight: 80,
    justifyContent: "center",
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
  toggleButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#5a67d8",
    marginBottom: 8,
  },
  toggleButtonText: {
    color: "#5a67d8",
    fontWeight: "600",
    fontSize: 14,
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
