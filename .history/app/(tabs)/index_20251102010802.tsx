import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { fetchTornadoIndicators } from "../../services/weatherService"; // ✅ make sure this file exists
import { StatusBar } from "expo-status-bar";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ---------- Types ----------
type Shelter = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  _distance?: number;
};

type WeatherData = {
  stormProbability: number;
  windSpeed: number;
  pressure: number;
  lastUpdate: string;
};

// ---------- Distance Utility ----------
const distanceMiles = (a: any, b: any) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// ---------- Shelters ----------
const sheltersRaw: Shelter[] = [
  { id: 1, name: "Edmon Low Library", address: "216 Edmon Low Library, Stillwater, OK", latitude: 36.1250, longitude: -97.0717 },
  { id: 2, name: "Student Union", address: "100 S Hester St, Stillwater, OK", latitude: 36.1252, longitude: -97.0720 },
  { id: 3, name: "Gallagher-Iba Arena", address: "200 Athletics Center, Stillwater, OK", latitude: 36.1276, longitude: -97.0730 },
  { id: 4, name: "Stillwater Mission of Hope", address: "1804 S Perkins Rd, Stillwater, OK", latitude: 36.1024, longitude: -97.0514 },
];

// ---------- Main App ----------
export default function App() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [nearest10, setNearest10] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 36.12,
    longitude: -97.07,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const mapRef = useRef<MapView | null>(null);
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [expanded, setExpanded] = useState(false);

  // Tornado alert data
  const [weatherData, setWeatherData] = useState<WeatherData>({
    stormProbability: 0,
    windSpeed: 0,
    pressure: 0,
    lastUpdate: "—",
  });

  // ---------- Tornado Indicator Fetch ----------
  useEffect(() => {
    const getWeather = async () => {
      try {
        const data = await fetchTornadoIndicators(region.latitude, region.longitude);
        if (!data) return;

        const prob =
          data.threat === "SEVERE"
            ? 90
            : data.threat === "HIGH"
            ? 70
            : data.threat === "MODERATE"
            ? 40
            : 10;

        setWeatherData({
          stormProbability: prob,
          windSpeed: data.wind,
          pressure: data.pressure,
          lastUpdate: new Date().toLocaleTimeString(),
        });

        if (prob >= 70) {
          Alert.alert("⚠️ Tornado Warning", "Severe tornado threat near your area!");
        }
      } catch (err) {
        console.warn("Weather fetch failed:", err);
      }
    };

    getWeather();
    const interval = setInterval(getWeather, 30 * 60 * 1000); // every 30 min
    return () => clearInterval(interval);
  }, [region]);

  // ---------- Location ----------
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setUserLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setShelters(sheltersRaw);
    })();
  }, []);

  // ---------- Compute nearest shelters ----------
  useEffect(() => {
    if (!userLocation) return;
    const updated = sheltersRaw.map((s) => ({
      ...s,
      _distance: distanceMiles(userLocation, { latitude: s.latitude, longitude: s.longitude }),
    }));
    setShelters(updated);
    setNearest10(updated.sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0)).slice(0, 10));
  }, [userLocation]);

  // ---------- Helpers ----------
  const openDirections = (s: Shelter) => {
    const url = Platform.select({
      ios: `maps://?daddr=${s.latitude},${s.longitude}`,
      android: `geo:0,0?q=${s.latitude},${s.longitude}(${s.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const toggleSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: expanded ? 150 : SCREEN_HEIGHT * 0.6,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  // ---------- Threat color helpers ----------
  const getThreatColor = (p: number) =>
    p >= 70 ? "#EF4444" : p >= 40 ? "#F97316" : p >= 20 ? "#EAB308" : "#10B981";
  const getThreatText = (p: number) =>
    p >= 70 ? "SEVERE" : p >= 40 ? "HIGH" : p >= 20 ? "MODERATE" : "LOW";
  const getThreatSymbol = (p: number) =>
    p >= 70 ? "warning" : p >= 40 ? "alert-sharp" : "happy";

  // ---------- Render ----------
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      {/* Tornado Alert Bar */}
      <View style={[styles.statusBar, { backgroundColor: getThreatColor(weatherData.stormProbability) }]}>
        <Ionicons name={getThreatSymbol(weatherData.stormProbability)} size={20} color="#fff" style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.statusTitle}>
            TORNADO THREAT: {getThreatText(weatherData.stormProbability)}
          </Text>
          <Text style={styles.statusSubtitle}>Updated {weatherData.lastUpdate}</Text>
        </View>
        <Text style={styles.statusPercentage}>{weatherData.stormProbability}%</Text>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        followsUserLocation
      >
        {shelters.map((s) => (
          <Marker key={s.id} coordinate={{ latitude: s.latitude, longitude: s.longitude }}>
            <View style={styles.marker}>
              <Ionicons name="home" size={18} color="#fff" />
            </View>
            <Callout onPress={() => openDirections(s)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{s.name}</Text>
                <Text style={styles.calloutAddr}>{s.address}</Text>
                <Text style={styles.calloutHint}>Tap for directions</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.sheet, { height: bottomSheetAnim }]}>
        <TouchableOpacity style={styles.pull} onPress={toggleSheet}>
          <View style={styles.indicator} />
          <Text style={styles.sheetTitle}>
            {expanded ? "Hide Shelters" : `Nearest 10 Shelters`}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={nearest10}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: s }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.addr}>
                {s.address} • {s._distance?.toFixed(1)} mi away
              </Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => openDirections(s)}>
                <Ionicons name="navigate" size={16} color="#fff" />
                <Text style={{ color: "#fff", marginLeft: 6 }}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </Animated.View>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  statusBar: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusTitle: { color: "#fff", fontWeight: "bold" },
  statusSubtitle: { color: "#f0f0f0", fontSize: 12 },
  statusPercentage: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#10B981",
  },
  calloutContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    width: 220,
  },
  calloutTitle: { fontWeight: "bold", color: "#111", marginBottom: 2 },
  calloutAddr: { color: "#333", fontSize: 12 },
  calloutHint: { color: "#007AFF", fontSize: 11, marginTop: 4 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  pull: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  indicator: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    marginBottom: 4,
  },
  sheetTitle: { fontWeight: "600", color: "#333" },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  name: { fontWeight: "bold", color: "#111" },
  addr: { color: "#555", marginTop: 2, fontSize: 12 },
  navBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 6,
    justifyContent: "center",
  },
});
