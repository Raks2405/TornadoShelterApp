import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Constants from "expo-constants";
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
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Circle } from "react-native-maps";
import { fetchTornadoIndicators } from "../../services/weatherService";

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

type LocationCoords = { latitude: number; longitude: number };

type WeatherData = {
  stormProbability: number;
  windSpeed: number;
  pressure: number;
  lastUpdate: string;
};

// ---------- Shelter Data ----------
const sheltersRaw: Shelter[] = [
  { id: 1, name: "ATRC (Advanced Technology Research Center)", address: "111 Engineering North, Stillwater, OK 74078", latitude: 36.1257, longitude: -97.0671 },
  { id: 2, name: "Business (Spears School of Business)", address: "294 Business Building, Stillwater, OK 74078", latitude: 36.1251, longitude: -97.0709 },
  { id: 3, name: "Classroom Building", address: "200 S Monroe St, Stillwater, OK 74078", latitude: 36.1258, longitude: -97.0703 },
];

// ---------- Distance Utility ----------
const distanceMiles = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

// ---------- Marker ----------
const ShelterMarker = ({ s, onPress }: { s: Shelter; onPress: (s: Shelter) => void }) => {
  const [freeze, setFreeze] = useState(false);
  const didLayout = useRef(false);

  return (
    <Marker
      coordinate={{ latitude: s.latitude, longitude: s.longitude }}
      title={s.name}
      description={s.address}
      tracksViewChanges={!freeze}
      anchor={{ x: 0.5, y: 0.5 }}
      calloutAnchor={{ x: 0.5, y: 0 }}
    >
      <View
        onLayout={() => {
          if (!didLayout.current) {
            didLayout.current = true;
            setTimeout(() => setFreeze(true), 400);
          }
        }}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: "#10B981",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 2,
          borderColor: "#fff",
          elevation: 8,
        }}
      >
        <Ionicons name="home" size={20} color="#fff" />
      </View>

      <Callout onPress={() => onPress(s)}>
        <View
          style={{
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 8,
            width: 220,
            borderWidth: 1,
            borderColor: "#ccc",
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#111" }}>{s.name}</Text>
          <Text style={{ color: "#333", fontSize: 12 }}>{s.address}</Text>
          <Text style={{ color: "#007AFF", fontSize: 11, marginTop: 4 }}>
            Tap for directions
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

// ---------- Main App ----------
export default function App() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [nearest10, setNearest10] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [region, setRegion] = useState({
    latitude: 36.12,
    longitude: -97.07,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [weatherData, setWeatherData] = useState<WeatherData>({
    stormProbability: 0,
    windSpeed: 0,
    pressure: 0,
    lastUpdate: "—",
  });

  const mapRef = useRef<MapView | null>(null);
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [expanded, setExpanded] = useState(false);

  // ---------- Tornado Alert Fetch ----------
  useEffect(() => {
    const getWeather = async () => {
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
    };
    getWeather();
    const interval = setInterval(getWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [region]);

  // ---------- Location ----------
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
      setUserLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setShelters(sheltersRaw);
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Low, timeInterval: 10000, distanceInterval: 30 },
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      );
    })();
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    const updated = sheltersRaw.map((s) => ({
      ...s,
      _distance: distanceMiles(userLocation, { latitude: s.latitude, longitude: s.longitude }),
    }));
    setShelters(updated);
    setNearest10([...updated].sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0)).slice(0, 10));
  }, [userLocation]);

  // ---------- Tornado Alert UI Helpers ----------
  const getThreatColor = (p: number) =>
    p >= 70 ? "#EF4444" : p >= 40 ? "#F97316" : p >= 20 ? "#EAB308" : "#10B981";
  const getThreatText = (p: number) =>
    p >= 70 ? "SEVERE" : p >= 40 ? "HIGH" : p >= 20 ? "MODERATE" : "LOW";
  const getThreatSymbol = (p: number) =>
    p >= 70 ? "warning" : p >= 40 ? "alert-sharp" : "happy";

  const toggleSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: expanded ? 150 : SCREEN_HEIGHT * 0.6,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const openDirections = (s: Shelter) => {
    const url = Platform.select({
      ios: `maps://?daddr=${s.latitude},${s.longitude}`,
      android: `geo:0,0?q=${s.latitude},${s.longitude}(${s.name})`,
    });
    if (url) Linking.openURL(url);
  };

  // ---------- Render ----------
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        followsUserLocation
        mapType="standard"
      >
        {userLocation && (
          <Circle
            center={userLocation}
            radius={500}
            fillColor="rgba(59,130,246,0.2)"
            strokeColor="rgba(59,130,246,0.5)"
          />
        )}
        {shelters.map((s) => (
          <ShelterMarker key={s.id} s={s} onPress={openDirections} />
        ))}
      </MapView>

      {/* ✅ Tornado Alert Banner */}
      <View
        style={[
          styles.statusBar,
          { backgroundColor: getThreatColor(weatherData.stormProbability) },
        ]}
      >
        <View style={styles.statusLeft}>
          <Ionicons
            name={getThreatSymbol(weatherData.stormProbability)}
            size={20}
            color="white"
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              TORNADO THREAT: {getThreatText(weatherData.stormProbability)}
            </Text>
            <Text style={styles.statusSubtitle}>
              Updated {weatherData.lastUpdate}
            </Text>
          </View>
        </View>
        <Text style={styles.statusPercentage}>
          {weatherData.stormProbability}%
        </Text>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.sheet, { height: bottomSheetAnim }]}>
        <TouchableOpacity style={styles.pull} onPress={toggleSheet}>
          <View style={styles.indicator} />
          <Text style={styles.sheetTitle}>
            {expanded ? "Hide Shelters" : "Nearest 10 Shelters"}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
  },
  statusLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  statusText: { marginLeft: 8, flex: 1 },
  statusTitle: { color: "white", fontWeight: "bold", fontSize: 12 },
  statusSubtitle: { color: "white", fontSize: 10, opacity: 0.9 },
  statusPercentage: { color: "white", fontSize: 24, fontWeight: "bold" },

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
