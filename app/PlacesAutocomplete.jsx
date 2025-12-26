// /PlacesAutocomplete.jsx
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function PlacesAutocomplete({
  apiKey,
  onPlaceSelected,
  placeholder = "Search for your address...",
}) {
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedInput = useDebounce(input, 400);
  const sessionToken = useRef(Math.random().toString(36).substr(2, 10)).current;

  // Fetch predictions
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    const qs = new URLSearchParams({
      input: debouncedInput,
      key: apiKey,
      sessiontoken: sessionToken,
      types: "address",
      language: "en",
      components: "country:in",
    }).toString();

    fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${qs}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "OK") {
          setPredictions(json.predictions);
        } else {
          setPredictions([]);
        }
      })
      .catch(() => {
        console.log("error in locatio")
        setPredictions([])
      })
      .finally(() => setLoading(false));
  }, [debouncedInput, apiKey, sessionToken]);

  // Fetch full place details + call parent
  const handleSelect = async (pred) => {
    setInput(pred.description);
    setPredictions([]);

    try {
      const detailsRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pred.place_id}&key=${apiKey}&fields=geometry,formatted_address,address_components`
      );
      const detailsJson = await detailsRes.json();

      if (detailsJson.status === "OK") {
        const result = detailsJson.result;
        const { lat, lng } = result.geometry.location;
        const fullAddress = result.formatted_address;

        // Extract city & state
        const get = (type) =>
          result.address_components?.find((c) => c.types.includes(type))?.long_name || "";

        const city =
          get("locality") ||
          get("sublocality") ||
          get("administrative_area_level_2") ||
          get("postal_town");
        const state = get("administrative_area_level_1");
        const postalCode = get("postal_code");
        const street = get("route");

        onPlaceSelected({
          fullAddress,
          placeId: pred.place_id,
          latitude: lat,
          longitude: lng,
          city,
          state,
          postalCode,
          street,
        });
      }
    } catch (err) {
      console.error("Place details error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={input}
        onChangeText={setInput}
      />
      {(predictions.length > 0 || loading) && (
        <View style={styles.dropdownWrapper}>
        <ScrollView
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}   // ← REQUIRED for nested scroll
        >
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color="#4A90E2" />
            </View>
          )}
          {predictions.map((p) => (
            <TouchableOpacity
              key={p.place_id}
              style={styles.item}
              onPress={() => handleSelect(p)}
            >
              <Text style={styles.mainText}>
                {p.structured_formatting?.main_text || p.description}
              </Text>
              <Text style={styles.secondaryText}>
                {p.structured_formatting?.secondary_text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", zIndex: 1000 },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFF",
    color: "#333",
    elevation: 2,
  },
  dropdown: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 280,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loading: { padding: 12, alignItems: "center" },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  mainText: { fontSize: 16, color: "#333", fontWeight: "600" },
  secondaryText: { fontSize: 13, color: "#666", marginTop: 2 },
});