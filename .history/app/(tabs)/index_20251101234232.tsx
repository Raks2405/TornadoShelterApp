import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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

// ---------- Shelter list ----------
const sheltersRaw: Shelter[] = [
  { id: 1, name: "ATRC (Advanced Technology Research Center)", address: "111 Engineering North, Stillwater, OK 74078", latitude: 36.1257, longitude: -97.0671 },
  { id: 2, name: "Business (Spears School of Business)", address: "294 Business Building, Stillwater, OK 74078", latitude: 36.1251, longitude: -97.0709 },
  { id: 3, name: "Classroom Building", address: "200 S Monroe St, Stillwater, OK 74078", latitude: 36.1258, longitude: -97.0703 },
  // ... (keep all up to id: 66)
];

// ---------- Distance function ----------
function distanceMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3958.7613; // Earth radius in miles
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ---------- Main ----------
export default function App() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 35.5,
    longitude: -97.5,
    latitudeDelta: 3,
    longitudeDelta: 3,
  });
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [expanded, setExpanded] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  // ---- Toggle sheet ----
  const toggleSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: expanded ? 150 : SCREEN_HEIGHT * 0.6,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  // ---- Get live location + set shelters ----
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        setShelters(sheltersRaw);
        return;
      }

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
      setUserLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setShelters(sheltersRaw);

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 5 },
        (pos) => {
          const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(next);
          setRegion((r) => ({ ...r, ...next }));
        }
      );
    })();

    return () => subscription?.remove?.();
  }, []);

  // ---- Sort by distance and limit to 10 nearest ----
  const sortedShelters = useMemo(() => {
    if (!userLocation) return shelters;
    return [...shelters]
      .map((s) => ({
        ...s,
        _distance: distanceMiles(userLocation, { latitude: s.latitude, longitude: s.longitude }),
      }))
      .sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0))
      .slice(0, 10);
  }, [shelters, userLocation]);

  // ---- Open directions (called from list or map marker) ----
  const openDirections = (s: Shelter) => {
    const url = Platform.select({
      ios: `maps://?daddr=${s.latitude},${s.longitude}`,
      android: `geo:0,0?q=${s.latitude},${s.longitude}(${s.name})`,
    });
    if (url) Linking.openURL(url);
  };

  // ---------- UI ----------
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        followsUserLocation
      >
        {sortedShelters.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            title={s.name}
            description={`${s.address} (${s._distance?.toFixed(1)} mi)`}
            onPress={() => openDirections(s)} // 👈 direct navigation when tapped
          >
            <View style={[styles.marker, { backgroundColor: "#10B981" }]}>
              <Ionicons name="home" size={18} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      <Animated.View style={[styles.sheet, { height: bottomSheetAnim }]}>
        <TouchableOpacity style={styles.pull} onPress={toggleSheet}>
          <View style={styles.indicator} />
          <Text style={styles.sheetTitle}>
            {expanded ? "Hide Shelters" : `Nearest 10 Shelters`}
          </Text>
        </TouchableOpacity>

        <ScrollView style={{ padding: 16 }}>
          {sortedShelters.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.addr}>
                {s.address} • {s._distance?.toFixed(1)} mi away
              </Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => openDirections(s)}>
                <Ionicons name="navigate" size={16} color="#fff" />
                <Text style={{ color: "#fff", marginLeft: 6 }}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
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
