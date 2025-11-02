import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
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

type Shelter = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  occupants: string;
  phone: string;
  address: string;
  accessible: boolean;
};

type RawShelter = {
  id: number;
  name: string;
  address: string;
  latitude: Number;
  longitude: Number;
};

// ---------- Raw shelter list ----------
const sheltersRaw: RawShelter[] = [
  {
    id: 1,
    name: "ATRC (Advanced Technology Research Center)",
    address: "111 Engineering North, Stillwater, OK 74078",
    latitude: 36.1257,
    longitude: -97.0671
  },
  {
    id: 2,
    name: "Business (Spears School of Business)",
    address: "294 Business Building, Stillwater, OK 74078",
    latitude: 36.1251,
    longitude: -97.0709
  },
  {
    id: 3,
    name: "Classroom Building",
    address: "200 S Monroe St, Stillwater, OK 74078",
    latitude: 36.1258,
    longitude: -97.0703
  },
  {
    id: 4,
    name: "Dairy Barn",
    address: "520 S Monroe St, Stillwater, OK 74078",
    latitude: 36.1199,
    longitude: -97.0702
  },
  {
    id: 5,
    name: "Engineering North",
    address: "111 Engineering North, Stillwater, OK 74078",
    latitude: 36.1259,
    longitude: -97.0673
  },
  {
    id: 6,
    name: "Gallagher-Iba Arena",
    address: "200 Athletics Center, Stillwater, OK 74078",
    latitude: 36.1276,
    longitude: -97.0730
  },
  {
    id: 7,
    name: "General Academic Building (GAB)",
    address: "720 W Hall of Fame Ave, Stillwater, OK 74078",
    latitude: 36.1270,
    longitude: -97.0738
  },
  {
    id: 8,
    name: "Iba Hall",
    address: "123 Iba Hall, Stillwater, OK 74078",
    latitude: 36.1272,
    longitude: -97.0725
  },
  {
    id: 9,
    name: "Legacy Hall",
    address: "377 N Hester St, Stillwater, OK 74078",
    latitude: 36.1271,
    longitude: -97.0729
  },
  {
    id: 10,
    name: "Edmon Low Library",
    address: "216 Edmon Low Library, Stillwater, OK 74078",
    latitude: 36.1250,
    longitude: -97.0717
  },
  {
    id: 11,
    name: "Life Sciences East & West",
    address: "111 Life Sciences East, Stillwater, OK 74078",
    latitude: 36.1242,
    longitude: -97.0710
  },
  {
    id: 12,
    name: "Math Sciences",
    address: "401 Math Sciences, Stillwater, OK 74078",
    latitude: 36.1246,
    longitude: -97.0715
  },
  {
    id: 13,
    name: "McElroy Hall",
    address: "206 McElroy Hall, Stillwater, OK 74078",
    latitude: 36.1215,
    longitude: -97.0700
  },
  {
    id: 14,
    name: "Nancy Randolph Davis Building",
    address: "315 Nancy Randolph Davis, Stillwater, OK 74078",
    latitude: 36.1239,
    longitude: -97.0721
  },
  {
    id: 15,
    name: "Noble Research Center",
    address: "135 Noble Research Center, Stillwater, OK 74078",
    latitude: 36.1235,
    longitude: -97.0708
  },
  {
    id: 16,
    name: "Psychology Building",
    address: "116 Psychology Building, Stillwater, OK 74078",
    latitude: 36.1248,
    longitude: -97.0724
  },
  {
    id: 17,
    name: "OADDL (Animal Disease Diagnostic Lab)",
    address: "1950 W Farm Rd, Stillwater, OK 74078",
    latitude: 36.1210,
    longitude: -97.0860
  },
  {
    id: 18,
    name: "Parker Hall",
    address: "201 Parker Hall, Stillwater, OK 74078",
    latitude: 36.1244,
    longitude: -97.0730
  },
  {
    id: 19,
    name: "Physical Sciences",
    address: "145 Physical Sciences, Stillwater, OK 74078",
    latitude: 36.1246,
    longitude: -97.0715
  },
  {
    id: 20,
    name: "Scott Hall",
    address: "201 Scott Hall, Stillwater, OK 74078",
    latitude: 36.1241,
    longitude: -97.0735
  },
  {
    id: 21,
    name: "Seretean Wellness Center",
    address: "1514 W Hall of Fame Ave, Stillwater, OK 74078",
    latitude: 36.1271,
    longitude: -97.0739
  },
  {
    id: 22,
    name: "Small Grains",
    address: "371 Agricultural Hall, Stillwater, OK 74078",
    latitude: 36.1240,
    longitude: -97.0726
  },
  {
    id: 23,
    name: "Stout Hall",
    address: "201 Stout Hall, Stillwater, OK 74078",
    latitude: 36.1243,
    longitude: -97.0737
  },
  {
    id: 24,
    name: "Student Health",
    address: "1202 W Farm Rd, Stillwater, OK 74078",
    latitude: 36.1225,
    longitude: -97.0732
  },
  {
    id: 25,
    name: "Student Union",
    address: "100 S Hester St, Stillwater, OK 74078",
    latitude: 36.1252,
    longitude: -97.0720
  },
  {
    id: 26,
    name: "USDA Facility",
    address: "1301 N Western Rd, Stillwater, OK 74075",
    latitude: 36.1330,
    longitude: -97.0860
  },
  {
    id: 27,
    name: "Vet Med Teaching Hospital",
    address: "2065 W Farm Rd, Stillwater, OK 74078",
    latitude: 36.1212,
    longitude: -97.0865
  },
  {
    id: 28,
    name: "Water Plant",
    address: "1006 W Farm Rd, Stillwater, OK 74078",
    latitude: 36.1220,
    longitude: -97.0850
  },
  {
    id: 29,
    name: "Wentz Hall",
    address: "201 Wentz Hall, Stillwater, OK 74078",
    latitude: 36.1249,
    longitude: -97.0732
  },
  {
    id: 30,
    name: "Willard Hall",
    address: "205 Willard Hall, Stillwater, OK 74078",
    latitude: 36.1245,
    longitude: -97.0728
  }
];


// ---------- Nominatim (OpenStreetMap) geocoder ----------
async function geocodeAddress(address: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "StillwaterShelterApp/1.0 (youremail@example.com)" },
    });
    const data = await res.json();
    const first = data?.[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  }
}

async function getAllShelters(): Promise<Shelter[]> {
  const cacheKey = "allGeocodedShelters_v1";
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed?.length) return parsed;
    } catch {}
  }

  const result: Shelter[] = [];
  for (const s of sheltersRaw) {
    const loc = await geocodeAddress(s.address);
    if (!loc) continue;
    result.push({
      id: s.id,
      name: s.name,
      latitude: loc.lat,
      longitude: loc.lng,
      occupants: "",
      phone: "",
      address: s.address,
      accessible: true,
    });
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim rate limit
  }
  await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}

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

  // ---- Toggle bottom sheet ----
  const toggleSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: expanded ? 150 : SCREEN_HEIGHT * 0.6,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  // ---- Get live location + load shelters ----
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }

      // Get initial fix
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
      setUserLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });

      // Subscribe to updates (real-time)
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (pos) => {
          const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(next);
          setRegion((r) => ({ ...r, ...next }));
        }
      );

      const data = await getAllShelters();
      setShelters(data);
    })();

    return () => {
      subscription?.remove?.();
    };
  }, []);

  // ---- Open directions in Maps ----
  const openDirections = (s: Shelter) => {
    const scheme = Platform.select({ ios: "maps:", android: "geo:" });
    const url = Platform.select({
      ios: `${scheme}?daddr=${s.latitude},${s.longitude}`,
      android: `${scheme}0,0?q=${s.latitude},${s.longitude}(${s.name})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {shelters.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            title={s.name}
            description={s.address}
          >
            <View style={[styles.marker, { backgroundColor: "#10B981" }]}>
              <Ionicons name="home" size={18} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ---------- Bottom Sheet ---------- */}
      <Animated.View style={[styles.sheet, { height: bottomSheetAnim }]}>
        <TouchableOpacity style={styles.pull} onPress={toggleSheet}>
          <View style={styles.indicator} />
          <Text style={styles.sheetTitle}>
            {expanded ? "Hide Shelters" : `All Shelters (${shelters.length})`}
          </Text>
        </TouchableOpacity>
        <ScrollView style={{ padding: 16 }}>
          {shelters.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.addr}>{s.address}</Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => openDirections(s)}>
                <Ionicons name="navigate" size={16} color="#fff" />
                <Text style={{ color: "#fff", marginLeft: 6 }}>Directions</Text>
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
