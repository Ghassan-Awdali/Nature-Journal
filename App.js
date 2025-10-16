import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";
import CameraScreen from "./screens/CameraScreen.js";
import CalendarScreen from "./screens/CalenderScreen.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("camera");

  useEffect(() => {
    console.log("🔵 App mounted, starting auth...");

    // Sign in anonymously
    signInAnonymously(auth)
      .then(() => {
        console.log("✅ Anonymous sign in successful");
      })
      .catch((error) => {
        console.error("❌ Sign in error:", error.code, error.message);
        setError(error.message);
        setLoading(false);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "🔵 Auth state changed:",
        user ? `User ID: ${user.uid}` : "No user"
      );

      if (user) {
        setUser(user);
        setError(null);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      console.log("🔵 Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>⚠️ Connection Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.helpText}>
          Check your Firebase config in firebase.js
        </Text>
      </View>
    );
  }

  // No user state
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Authentication Failed</Text>
        <Text style={styles.helpText}>Please close and restart the app</Text>
      </View>
    );
  }

  // Success - show app with navigation
  return (
    <View style={styles.appContainer}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, currentScreen === "camera" && styles.activeTab]}
          onPress={() => setCurrentScreen("camera")}
        >
          <Text
            style={[
              styles.tabText,
              currentScreen === "camera" && styles.activeTabText,
            ]}
          >
            📷 Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentScreen === "calendar" && styles.activeTab]}
          onPress={() => setCurrentScreen("calendar")}
        >
          <Text
            style={[
              styles.tabText,
              currentScreen === "calendar" && styles.activeTabText,
            ]}
          >
            📅 Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {currentScreen === "camera" ? (
        <CameraScreen user={user} />
      ) : (
        <CalendarScreen user={user} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  appContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  helpText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
});
