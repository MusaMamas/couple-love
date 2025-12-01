import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Use react-native-maps instead of expo-maps
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  doc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

interface MemoryMarker {
  id: string;
  latitude: number;
  longitude: number;
  photoUri: string;
  caption: string;
  createdBy: string;
  createdAt: any;
}

export default function MemoryMapScreen() {
  const navigation = useNavigation();
  const [markers, setMarkers] = useState<MemoryMarker[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MemoryMarker | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 60.1699,
    longitude: 24.9384,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Get user's current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, []);

  // Get couple ID
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsub = onSnapshot(doc(db, "users", uid), (userSnap) => {
      if (userSnap.exists()) {
        setCoupleId(userSnap.data().coupleId || null);
      }
    });

    return unsub;
  }, []);

  // Load markers for couple
  useEffect(() => {
    if (!coupleId) return;

    const q = query(
      collection(db, "memories"),
      where("coupleId", "==", coupleId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const loadedMarkers: MemoryMarker[] = [];
      snapshot.forEach((doc) => {
        loadedMarkers.push({
          id: doc.id,
          ...doc.data(),
        } as MemoryMarker);
      });
      setMarkers(loadedMarkers);
    });

    return unsub;
  }, [coupleId]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setShowAddModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera roll permission to add photos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need camera permission to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const saveMemory = async () => {
    if (!selectedLocation || !photoUri || !coupleId) {
      Alert.alert("Error", "Please select a location and add a photo");
      return;
    }

    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;

      await addDoc(collection(db, "memories"), {
        coupleId,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        photoUri,
        caption: caption.trim(),
        createdBy: uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Memory added to map!");
      closeAddModal();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save memory");
    } finally {
      setSaving(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedLocation(null);
    setPhotoUri(null);
    setCaption("");
  };

  const viewMarker = (marker: MemoryMarker) => {
    setSelectedMarker(marker);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedMarker(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Memories 💜</Text>
        <View style={{ width: 60 }} />
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            onPress={() => viewMarker(marker)}
            title={marker.caption || "Memory"}
          />
        ))}
      </MapView>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📍 Tap anywhere on the map to add a memory
        </Text>
        <Text style={styles.infoSubtext}>
          {markers.length} {markers.length === 1 ? "memory" : "memories"} saved
        </Text>
      </View>

      {/* Add Memory Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Memory</Text>

            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No photo selected</Text>
              </View>
            )}

            <View style={styles.photoButtons}>
              <TouchableOpacity onPress={takePhoto} style={styles.photoButton}>
                <Text style={styles.photoButtonText}>📷 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
                <Text style={styles.photoButtonText}>🖼️ Choose Photo</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption... (optional)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={closeAddModal}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveMemory}
                style={[styles.modalButton, styles.saveButton]}
                disabled={!photoUri || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Memory</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Memory Modal */}
      <Modal visible={showViewModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.viewModalContent}>
            {selectedMarker && (
              <>
                <Image
                  source={{ uri: selectedMarker.photoUri }}
                  style={styles.fullImage}
                />
                {selectedMarker.caption ? (
                  <Text style={styles.viewCaption}>{selectedMarker.caption}</Text>
                ) : null}
                <TouchableOpacity onPress={closeViewModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#5a67d8",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  map: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: "#f0f0ff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0ff",
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },
  infoSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f7f7f8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  placeholderText: {
    color: "#999",
    fontSize: 14,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    backgroundColor: "#f7f7f8",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  captionInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f7f7f8",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#5a67d8",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  viewModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  fullImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  viewCaption: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#5a67d8",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});