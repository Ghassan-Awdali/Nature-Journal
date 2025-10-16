import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function CalendarScreen({ user }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [entries, setEntries] = useState({});
  const [dayEntries, setDayEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserEntries();
  }, [user]);

  const fetchUserEntries = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "entries"),
        where("userId", "==", user.uid)
        //orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(q);
      const entriesData = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.createdAt).toISOString().split("T")[0];

        if (!entriesData[date]) {
          entriesData[date] = [];
        }
        entriesData[date].push({ id: doc.id, ...data });
      });

      setEntries(entriesData);
    } catch (error) {
      console.error("Error fetching entries:", error);
      Alert.alert("Error", "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    setDayEntries(entries[day.dateString] || []);
  };

  const getMarkedDates = () => {
    const marked = {};
    Object.keys(entries).forEach((date) => {
      marked[date] = {
        marked: true,
        dotColor: "#4CAF50",
        selectedColor: "#4CAF50",
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#2196F3",
      };
    }

    return marked;
  };

  const deleteEntry = async (entryId) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "entries", entryId));
            fetchUserEntries(); // Refresh the list
            Alert.alert("Success", "Entry deleted successfully");
          } catch (error) {
            console.error("Error deleting entry:", error);
            Alert.alert("Error", "Failed to delete entry");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your nature journal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Nature Journal Calendar</Text>

      <Calendar
        onDayPress={onDayPress}
        markedDates={getMarkedDates()}
        theme={{
          selectedDayBackgroundColor: "#2196F3",
          todayTextColor: "#4CAF50",
          arrowColor: "#4CAF50",
          monthTextColor: "#2e7d32",
          textDayFontWeight: "600",
          textMonthFontWeight: "bold",
        }}
        style={styles.calendar}
      />

      {selectedDate && (
        <View style={styles.entriesContainer}>
          <Text style={styles.dateTitle}>
            Entries for{" "}
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          {dayEntries.length > 0 ? (
            <FlatList
              data={dayEntries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.entryCard}>
                  <Image
                    source={{ uri: item.photoURL }}
                    style={styles.entryImage}
                  />
                  <Text style={styles.entryCaption}>{item.caption}</Text>
                  <Text style={styles.entryTime}>
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteEntry(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <View style={styles.noEntriesContainer}>
              <Text style={styles.noEntries}>No entries for this date</Text>
              <Text style={styles.noEntriesSubtext}>
                Take a photo to start your nature journal for this day!
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2e7d32",
    textAlign: "center",
  },
  calendar: {
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  entriesContainer: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  entryImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  entryCaption: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    lineHeight: 20,
  },
  entryTime: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  deleteButton: {
    alignSelf: "flex-end",
    padding: 8,
    backgroundColor: "#ffebee",
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#d32f2f",
    fontSize: 12,
    fontWeight: "600",
  },
  noEntriesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  noEntries: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginBottom: 10,
  },
  noEntriesSubtext: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 14,
    fontStyle: "italic",
  },
});
