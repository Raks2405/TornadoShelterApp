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
  ScrollView,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";

// ---------- CONFIG ----------
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Shelter = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  _distance?: number;
};

type TornadoAlert = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
};

// ---------- Shelters ----------
const sheltersRaw: Shelter[] = [
  { id: 1, name: "Edmon Low Library", address: "216 Edmon Low Library, Stillwater, OK", latitude: 36.1250, longitude: -97.0717 },
  { id: 2, name: "Student Union", address: "100 S Hester St, Stillwater, OK", latitude: 36.1252, longitude: -97.0720 },
  { id: 3, name: "Gallagher-Iba Arena", address: "200 Athletics Center, Stillwater, OK", latitude: 36.1276, longitude: -97.0730 },
];

// ---------- Utilities ----------
const distanceMiles = (a: any, b: any) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// ---------- Tornado Marker ----------
const TornadoMarker = ({ alert }: { alert: TornadoAlert }) => (
  <Marker coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}>
    <View style={styles.tornadoMarker}>
      <Ionicons name="warning" size={20} color="#fff" />
    </View>
    <Callout>
      <View style={styles.calloutContainer}>
        <Text style={styles.calloutTitle}>{alert.title}</Text>
        <Text style={styles.calloutAddr}>{alert.description.slice(0, 100)}...</Text>
      </View>
    </Callout>
  </Marker>
);

// ---------- Main App ----------
export default function App() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [tornadoAlerts, setTornadoAlerts] = useState<TornadoAlert[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 36.12,
    longitude: -97.07,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [nearest10, setNearest10] = useState<Shelter[]>([]);
  const [expanded, setExpanded] = useState(false);
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;

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

  // ---- Get location ----
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission not granted");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setShelters(sheltersRaw);
    })();
  }, []);

  // ---- Compute nearest 10 shelters ----
  useEffect(() => {
    if (!userLocation) return;
    const updated = sheltersRaw.map((s) => ({
      ...s,
      _distance: distanceMiles(userLocation, { latitude: s.latitude, longitude: s.longitude }),
    }));
    setNearest10(updated.sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0)).slice(0, 10));
  }, [userLocation]);

  // ---- Fetch Tornado Alerts ----
  useEffect(() => {
    const fetchTornadoAlerts = async () => {
      try {
        const res = await fetch(
          "https://api.weather.gov/alerts/active?area=OK&event=Tornado%20Warning"
        );
        const data = await res.json();
        if (!data.features) return;
        const alerts = data.features
          .map((f: any, i: number) => {
            const coords = f.geometry?.coordinates?.[0]?.[0];
            return coords
              ? {
                  id: f.id ?? `alert-${i}`,
                  title: f.properties?.headline ?? "Tornado Warning",
                  description: f.properties?.description ?? "",
                  latitude: coords[1],
                  longitude: coords[0],
                }
              : null;
          })
          .filter(Boolean) as TornadoAlert[];
        setTornadoAlerts(alerts);

        // Check if any alert is near user
        if (userLocation && alerts.length > 0) {
          const near = alerts.find(
            (a) => distanceMiles(userLocation, a) < 50
          );
          if (near) Alert.alert("⚠️ Tornado Warning", "Tornado warning near your area!");
        }
      } catch (err) {
        console.warn("Tornado fetch failed:", err);
      }
    };

    fetchTornadoAlerts();
    const interval = setInterval(fetchTornadoAlerts, 300000); // every 5 min
    return () => clearInterval(interval);
  }, [userLocation]);

  return (
    <View style={{ flex: 1 }}>
      {/* Tornado Banner */}
      {tornadoAlerts.length > 0 && (
        <View style={styles.banner}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={styles.bannerText}>Active Tornado Warnings in Oklahoma!</Text>
        </View>
      )}

      {/* Map */}
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
      >
        {shelters.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
          >
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

        {tornadoAlerts.map((a) => (
          <TornadoMarker key={a.id} alert={a} />
        ))}
      </MapView>

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
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  tornadoMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
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
  banner: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    zIndex: 100,
  },
  bannerText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
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
