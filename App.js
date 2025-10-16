import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";
import CameraScreen from "./screens/CameraScreen";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Success - show camera screen
  return <CameraScreen user={user} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
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
