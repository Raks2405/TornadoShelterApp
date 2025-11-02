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
import MapView, { Marker, PROVIDER_GOOGLE, Circle, Region } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Shelter = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distance: string;
  time: string;
  occupants: string;
  phone: string;
  address: string;
  accessible: boolean;
};

type RawShelter = {
  id: number;
  name: string;
  address: string;
  overnight?: boolean;
};

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

// =======================================================
// 1️⃣ Raw shelter list (you provided)
// =======================================================
const sheltersRaw: RawShelter[] = [
  { id: 1, name: "Bartlesville B the Light", address: "219 N Virginia Ave, Bartlesville, OK", overnight: true },
  { id: 2, name: "C3 - Cross Connection Church", address: "329 N Pesotum, Shawnee, OK", overnight: true },
  { id: 3, name: "Checotah City Hall", address: "N Broadway, Checotah, OK" },
  { id: 4, name: "Claremore - Grace United Methodist Church", address: "9472 OK-20, Claremore, OK", overnight: true },
  { id: 5, name: "Clinton Cheyenne & Arapaho ERC", address: "2105 Dogpatch Rd, Clinton, OK" },
  { id: 6, name: "Coalgate First Baptist Church", address: "106 West Hanover, Coalgate, OK" },
  { id: 7, name: "Concho Cheyenne & Arapaho ERC", address: "200 Wolf Robe Circle, Concho, OK" },
  { id: 8, name: "Elk City First Baptist Church", address: "1600 W Country Club Blvd, Elk City, OK", overnight: true },
  { id: 9, name: "Enid Hope Outreach", address: "815 W Main, Enid, OK", overnight: true },
  { id: 10, name: "Enid Salvation Army", address: "516 N Independence, Enid, OK", overnight: true },
  { id: 11, name: "First Baptist Church of Boise City", address: "103 Cimarron Ave, Boise City, OK", overnight: true },
  { id: 12, name: "Geary Cheyenne & Arapaho ERC", address: "132 E Main, Geary, OK" },
  { id: 13, name: "Grove Community Center", address: "104 W 3rd, Grove, OK", overnight: true },
  { id: 14, name: "Hammon Cheyenne & Arapaho ERC", address: "20415 Hwy 33, Hammon, OK" },
  { id: 15, name: "Hands of Hope Food and Resource Center", address: "724 W Main St, Durant, OK", overnight: true },
  { id: 16, name: "Higher Ground Church", address: "217 W Farrall St, Shawnee, OK", overnight: true },
  { id: 17, name: "Hugo - Compassion of Christ Ministries", address: "301 W Main, Hugo, OK" },
  { id: 18, name: "Jay Community Center", address: "429 S 9th, Jay, OK", overnight: true },
  { id: 19, name: "Kingfisher Cheyenne & Arapaho ERC", address: "400 W Erwin, Kingfisher, OK" },
  { id: 20, name: "Lawton Salvation Army Corps", address: "1306 SW E Ave, Lawton, OK", overnight: true },
  { id: 21, name: "Ma Ma’s Christ Van", address: "601 W Broadway, Seminole, OK", overnight: true },
  { id: 22, name: "Mayes County Fairgrounds", address: "2200 NE 1st St, Pryor, OK" },
  { id: 23, name: "Miami Main Attractions", address: "116 N Main, Miami, OK" },
  { id: 24, name: "Okmulgee First Free Will Baptist TruLife Center", address: "601 S Oklahoma, Okmulgee, OK" },
  { id: 25, name: "Pleasant Ridge Schoolhouse", address: "125 N Commercial Ave, Temple, OK" },
  { id: 26, name: "Pryor Impact Center of Oklahoma", address: "315 N Adair, Pryor, OK", overnight: true },
  { id: 27, name: "Pryor Rescue Mission", address: "640 W Graham, Pryor, OK", overnight: true },
  { id: 28, name: "Seiling Cheyenne & Arapaho ERC", address: "411 N Main, Seiling, OK" },
  { id: 29, name: "Stillwater Mission of Hope", address: "1804 S Perkins Rd, Stillwater, OK", overnight: true },
  { id: 30, name: "Tahlequah First United Methodist Church", address: "300 W Delaware, Tahlequah, OK" },
  { id: 31, name: "Tulsa Metropolitan Area Command (Salvation Army)", address: "924 N Hudson Ave, Tulsa, OK", overnight: true },
  { id: 32, name: "Vinita Day Center", address: "131 S Wilson St, Vinita, OK" },
  { id: 33, name: "Vinita Grand Mental Health", address: "405 E Excelsior, Vinita, OK", overnight: true },
  { id: 34, name: "Watonga Cheyenne & Arapaho ERC", address: "257210 East Rd, Watonga, OK" },
  { id: 35, name: "West Siloam Springs Assembly of God", address: "5524 Cedar Dr, Colcord, OK" },
  { id: 36, name: "Woodward Cheyenne & Arapaho ERC", address: "43554 County Rd, Woodward, OK" },
];

// =======================================================
// 2️⃣ Helper functions
// =======================================================
const deg2rad = (deg: number) => (deg * Math.PI) / 180;
const distanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lon - a.lon);
  const la1 = deg2rad(a.lat), la2 = deg2rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const fmtMiles = (km: number) => (km * 0.621371).toFixed(1) + " mi";
const etaFromMiles = (mi: number) => Math.max(1, Math.round((mi / 30) * 60)) + " min";

async function geocodeAddress(address: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch (e) {
    console.warn("Geocode error:", e);
    return null;
  }
}

async function getShelters(userLat: number, userLon: number): Promise<Shelter[]> {
  const cacheKey = "geocodedShelters_v1";
  const cached = await AsyncStorage.getItem(cacheKey);
  let geocoded: Array<RawShelter & { latitude: number; longitude: number }> | null = null;

  if (cached) {
    try { geocoded = JSON.parse(cached); } catch {}
  }

  if (!geocoded) {
    geocoded = [];
    for (const rs of sheltersRaw) {
      const loc = await geocodeAddress(rs.address);
      if (!loc) continue;
      geocoded.push({ ...rs, latitude: loc.lat, longitude: loc.lng });
      await new Promise(r => setTimeout(r, 80)); // avoid API throttling
    }
    await AsyncStorage.setItem(cacheKey, JSON.stringify(geocoded));
  }

  const origin = { lat: userLat, lon: userLon };
  const list: Shelter[] = geocoded.map((g, idx) => {
    const dKm = distanceKm(origin, { lat: g.latitude, lon: g.longitude });
    const miles = dKm * 0.621371;
    return {
      id: g.id ?? idx + 1,
      name: g.name,
      latitude: g.latitude,
      longitude: g.longitude,
      distance: fmtMiles(dKm),
      time: etaFromMiles(miles),
      occupants: "",
      phone: "",
      address: g.address,
      accessible: true,
    };
  }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  return list;
}

// =======================================================
// 3️⃣ Main component
// =======================================================
export default function App() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 36.1156,
    longitude: -97.0584,
    latitudeDelta: 1,
    longitudeDelta: 1,
  });
  const mapRef = useRef<MapView | null>(null);
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [expanded, setExpanded] = useState(false);

  const toggleSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: expanded ? 150 : SCREEN_HEIGHT * 0.6,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    getShelters(userLocation.latitude, userLocation.longitude).then(setShelters);
    setRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 1,
      longitudeDelta: 1,
    });
  }, [userLocation]);

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
        showsUserLocation
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
          <Marker key={s.id} coordinate={{ latitude: s.latitude, longitude: s.longitude }}>
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
            {expanded ? "Hide Shelters" : `Nearby Shelters (${shelters.length})`}
          </Text>
        </TouchableOpacity>
        <ScrollView style={{ padding: 16 }}>
          {shelters.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.addr}>{s.address}</Text>
              <Text style={styles.sub}>{s.distance} • {s.time}</Text>
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

// =======================================================
// 4️⃣ Styles
// =======================================================
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
  sub: { marginTop: 2, fontSize: 12, color: "#444" },
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
