import React, { useState } from "react";
import {
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  FlatList,
  Text,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MapView, { Marker } from "react-native-maps";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";

export const LocationInput = ({
  editable,
  location,
  setLocation,
}: {
  editable?: boolean;
  location: string;
  setLocation: (value: string) => void;
}) => {
  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  // const [location, setLocation] = useState(""); // For the main input field
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [searchQuery, setSearchQuery] = useState(""); // For the search input inside the modal
  const [searchResults, setSearchResults] = useState([]);

  // Function to fetch locations from OpenStreetMap
  const searchLocation = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json`,
        {
          headers: {
            "User-Agent": "MyFitnessApp/1.0 (lukabugarin6@gmail.com)", // Replace with your app name and email
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data); // Store search results
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  // Handle selecting a location from the search results
  const handleSelectLocation = (location: any) => {
    setSelectedLocation({
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    });
    setLocation(location.display_name); // Set the location name in the main input field
    setLocationModalVisible(false); // Close the modal
  };

  // Function to clear the location
  const clearLocation = () => {
    setLocation("");
    setSearchQuery("");
    setSelectedLocation({ latitude: 37.78825, longitude: -122.4324 });
    setSearchResults([]);
  };

  return (
    <>
      {/* Main Input Field */}
      <View style={styles.inputWrapper}>
        <View style={styles.iconWrapper}>
          <Ionicons name="location-outline" size={20} color={mainTextColor} />
        </View>

        {/* Wrap TextInput with TouchableOpacity to open modal on press */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ width: "100%", pointerEvents: editable ? "auto" : "none" }}
          onPress={() => {
            editable && setLocationModalVisible(true);
          }} // Open modal on press
        >
          <TextInput
            style={{
              ...styles.input,
              borderColor:
                colorScheme === "dark"
                  ? "rgb(80, 80, 80)"
                  : "rgb(204, 204, 204)",
              color: mainTextColor,
              pointerEvents: "none",
            }}
            placeholder="Select Training Location"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={location}
            editable={false} // Prevent manual editing
            multiline
          />
        </TouchableOpacity>

        {/* X icon to clear location */}
        {(location && editable) ? (
          <TouchableOpacity
            style={styles.clearIconWrapper}
            onPress={clearLocation}
          >
            <Ionicons name="close-outline" size={18} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Map Picker Modal */}
      <Modal
        visible={locationModalVisible}
        statusBarTranslucent
        animationType="slide"
        transparent={false}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Search Bar Inside Modal */}
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              placeholderTextColor={
                colorScheme === "dark"
                  ? "rgb(170, 170, 170)"
                  : "rgb(105, 105, 105)"
              }
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length >= 3) {
                  searchLocation(text); // Trigger search after 3 characters
                }
              }}
            />
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item: any) => item?.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectLocation(item)}>
                  <View style={styles.searchItem}>
                    <Text>{item?.display_name}</Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.searchResults}
            />
          )}

          {/* Map View */}
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)} // Update location on tap
          >
            <Marker coordinate={selectedLocation} />
          </MapView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <Ionicons name="close" size={28} color={"#000"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSelectLocation(selectedLocation)}
            >
              <Ionicons name="add-circle-outline" size={28} color={"#000"} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    width: 24,
    height: 24,
  },
  input: {
    maxWidth: "90%",
    flexGrow: 1,
    minHeight: 50,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 6,
    paddingRight: 16
    // paddingRight: 40
  },
  clearIconWrapper: {
    position: "absolute",
    right: 0,
    bottom: "30%",
    // transform: [{ translateY: -12 }],
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  searchBar: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    zIndex: 1,
    elevation: 3,
    paddingTop: 60,
  },
  searchInput: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingLeft: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  searchResults: {
    position: "absolute",
    top: 80,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    zIndex: 2,
    maxHeight: "50%",
    borderRadius: 8,
    elevation: 4,
    padding: 5,
  },
  searchItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fafafa",
  },
  map: {
    width: "100%",
    marginTop: 10,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 10,
    width: "100%",
    paddingBottom: 30,
  },
});
