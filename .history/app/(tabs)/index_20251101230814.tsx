import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
};

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

// --- Raw list (name + address) ---
const sheltersRaw: RawShelter[] = [
  { id: 1, name: "Bartlesville B the Light", address: "219 N Virginia Ave, Bartlesville, OK" },
  { id: 2, name: "C3 - Cross Connection Church", address: "329 N Pesotum, Shawnee, OK" },
  { id: 3, name: "Checotah City Hall", address: "N Broadway, Checotah, OK" },
  { id: 4, name: "Claremore - Grace United Methodist Church", address: "9472 OK-20, Claremore, OK" },
  { id: 5, name: "Clinton Cheyenne & Arapaho ERC", address: "2105 Dogpatch Rd, Clinton, OK" },
  { id: 6, name: "Coalgate First Baptist Church", address: "106 West Hanover, Coalgate, OK" },
  { id: 7, name: "Concho Cheyenne & Arapaho ERC", address: "200 Wolf Robe Circle, Concho, OK" },
  { id: 8, name: "Elk City First Baptist Church", address: "1600 W Country Club Blvd, Elk City, OK" },
  { id: 9, name: "Enid Hope Outreach", address: "815 W Main, Enid, OK" },
  { id: 10, name: "Enid Salvation Army", address: "516 N Independence, Enid, OK" },
  { id: 11, name: "First Baptist Church of Boise City", address: "103 Cimarron Ave, Boise City, OK" },
  { id: 12, name: "Geary Cheyenne & Arapaho ERC", address: "132 E Main, Geary, OK" },
  { id: 13, name: "Grove Community Center", address: "104 W 3rd, Grove, OK" },
  { id: 14, name: "Hammon Cheyenne & Arapaho ERC", address: "20415 Hwy 33, Hammon, OK" },
  { id: 15, name: "Hands of Hope Food and Resource Center", address: "724 W Main St, Durant, OK" },
  { id: 16, name: "Higher Ground Church", address: "217 W Farrall St, Shawnee, OK" },
  { id: 17, name: "Hugo - Compassion of Christ Ministries", address: "301 W Main, Hugo, OK" },
  { id: 18, name: "Jay Community Center", address: "429 S 9th, Jay, OK" },
  { id: 19, name: "Kingfisher Cheyenne & Arapaho ERC", address: "400 W Erwin, Kingfisher, OK" },
  { id: 20, name: "Lawton Salvation Army Corps", address: "1306 SW E Ave, Lawton, OK" },
  { id: 21, name: "Ma Ma’s Christ Van", address: "601 W Broadway, Seminole, OK" },
  { id: 22, name: "Mayes County Fairgrounds", address: "2200 NE 1st St, Pryor, OK" },
  { id: 23, name: "Miami Main Attractions", address: "116 N Main, Miami, OK" },
  { id: 24, name: "Okmulgee First Free Will Baptist TruLife Center", address: "601 S Oklahoma, Okmulgee, OK" },
  { id: 25, name: "Pleasant Ridge Schoolhouse", address: "125 N Commercial Ave, Temple, OK" },
  { id: 26, name: "Pryor Impact Center of Oklahoma", address: "315 N Adair, Pryor, OK" },
  { id: 27, name: "Pryor Rescue Mission", address: "640 W Graham, Pryor, OK" },
  { id: 28, name: "Seiling Cheyenne & Arapaho ERC", address: "411 N Main, Seiling, OK" },
  { id: 29, name: "Stillwater Mission of Hope", address: "1804 S Perkins Rd, Stillwater, OK" },
  { id: 30, name: "Tahlequah First United Methodist Church", address: "300 W Delaware, Tahlequah, OK" },
  { id: 31, name: "Tulsa Metropolitan Area Command (Salvation Army)", address: "924 N Hudson Ave, Tulsa, OK" },
  { id: 32, name: "Vinita Day Center", address: "131 S Wilson St, Vinita, OK" },
  { id: 33, name: "Vinita Grand Mental Health", address: "405 E Excelsior, Vinita, OK" },
  { id: 34, name: "Watonga Cheyenne & Arapaho ERC", address: "257210 East Rd, Watonga, OK" },
  { id: 35, name: "West Siloam Springs Assembly of God", address: "5524 Cedar Dr, Colcord, OK" },
  { id: 36, name: "Woodward Cheyenne & Arapaho ERC", address: "43554 County Rd, Woodward, OK" },
];

// --- Helper to geocode each shelter once ---
// Replace the Google version with this:
async function geocodeAddress(address: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      // Nominatim requires a descriptive UA + contact per usage policy
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
    await new Promise(r => setTimeout(r, 80));
  }
  await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}

export default function App() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [region, setRegion] = useState({
    latitude: 35.5,
    longitude: -97.5,
    latitudeDelta: 3,
    longitudeDelta: 3,
  });
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [expanded, setExpanded] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const toggleSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: expanded ? 150 : SCREEN_HEIGHT * 0.6,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      const data = await getAllShelters();
      setShelters(data);
    })();
  }, []);

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
