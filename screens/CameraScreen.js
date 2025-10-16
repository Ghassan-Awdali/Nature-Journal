import React, { useState } from "react";
import {
  View,
  Image,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CameraScreen({ user }) {
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Camera permission is required to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      console.log("✅ Photo taken:", result.assets[0].uri);
      setPhoto(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Gallery access is required to select photos."
      );
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      console.log("✅ Photo selected:", result.assets[0].uri);
      setPhoto(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (imageUri) => {
    console.log("📤 Uploading to Cloudinary...");

    const formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "photo.jpg",
    });

    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "nature-journal");

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Cloudinary error:", error);
      throw new Error(error.error?.message || "Upload failed");
    }

    const data = await response.json();
    console.log("✅ Uploaded to Cloudinary:", data.secure_url);
    return data.secure_url;
  };

  const saveEntry = async () => {
    if (!photo) {
      Alert.alert("No Photo", "Please take or select a photo first.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      setUploading(true);
      console.log("💾 Starting save process...");

      // Upload to Cloudinary
      const photoURL = await uploadToCloudinary(photo);

      // Save to Firestore
      console.log("💾 Saving to Firestore...");
      const docRef = await addDoc(collection(db, "entries"), {
        userId: user.uid,
        photoURL: photoURL,
        caption: caption.trim(),
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });

      console.log("✅ Entry saved! Doc ID:", docRef.id);

      Alert.alert("Success! 🎉", "Your nature entry has been saved!");

      // Clear form
      setPhoto(null);
      setCaption("");
    } catch (error) {
      console.error("❌ Save error:", error);
      Alert.alert(
        "Save Failed",
        `Could not save entry: ${error.message}\n\nMake sure you've set up Cloudinary credentials.`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌿 Nature Journal</Text>
      <Text style={styles.subtitle}>Capture your outdoor moments</Text>

      {photo ? (
        <Image source={{ uri: photo }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📷</Text>
          <Text style={styles.placeholderSubtext}>No photo yet</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={takePhoto}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>📷 Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={pickFromGallery}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>🖼️ Gallery</Text>
        </TouchableOpacity>
      </View>

      {photo && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Describe what you saw... Where were you? What did you feel?"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            editable={!uploading}
          />

          <TouchableOpacity
            style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
            onPress={saveEntry}
            disabled={uploading}
          >
            <Text style={styles.saveButtonText}>
              {uploading ? "⏳ Saving..." : "💾 Save Entry"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.userInfo}>User: {user.uid.slice(0, 10)}...</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#2e7d32",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
  },
  image: {
    width: 320,
    height: 320,
    borderRadius: 15,
    marginBottom: 20,
  },
  placeholder: {
    width: 320,
    height: 320,
    backgroundColor: "#e8f5e9",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#a5d6a7",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 60,
    marginBottom: 10,
  },
  placeholderSubtext: {
    color: "#66bb6a",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    minWidth: 145,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#c8e6c9",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 18,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#90CAF9",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    marginTop: 30,
    fontSize: 11,
    color: "#999",
  },
});
