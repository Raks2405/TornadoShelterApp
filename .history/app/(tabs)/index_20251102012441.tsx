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
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import { logger } from "react-native-reanimated/lib/typescript/common";

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
  { id: 4, name: "Dairy Barn", address: "520 S Monroe St, Stillwater, OK 74078", latitude: 36.1199, longitude: -97.0702 },
  { id: 5, name: "Engineering North", address: "111 Engineering North, Stillwater, OK 74078", latitude: 36.1259, longitude: -97.0673 },
  { id: 6, name: "Gallagher-Iba Arena", address: "200 Athletics Center, Stillwater, OK 74078", latitude: 36.1276, longitude: -97.0730 },
  { id: 7, name: "General Academic Building (GAB)", address: "720 W Hall of Fame Ave, Stillwater, OK 74078", latitude: 36.1270, longitude: -97.0738 },
  { id: 8, name: "Iba Hall", address: "123 Iba Hall, Stillwater, OK 74078", latitude: 36.1272, longitude: -97.0725 },
  { id: 9, name: "Legacy Hall", address: "377 N Hester St, Stillwater, OK 74078", latitude: 36.1271, longitude: -97.0729 },
  { id: 10, name: "Edmon Low Library", address: "216 Edmon Low Library, Stillwater, OK 74078", latitude: 36.1250, longitude: -97.0717 },
  { id: 11, name: "Life Sciences East & West", address: "111 Life Sciences East, Stillwater, OK 74078", latitude: 36.1242, longitude: -97.0710 },
  { id: 12, name: "Math Sciences", address: "401 Math Sciences, Stillwater, OK 74078", latitude: 36.1246, longitude: -97.0715 },
  { id: 13, name: "McElroy Hall", address: "206 McElroy Hall, Stillwater, OK 74078", latitude: 36.1215, longitude: -97.0700 },
  { id: 14, name: "Nancy Randolph Davis Building", address: "315 Nancy Randolph Davis, Stillwater, OK 74078", latitude: 36.1239, longitude: -97.0721 },
  { id: 15, name: "Noble Research Center", address: "135 Noble Research Center, Stillwater, OK 74078", latitude: 36.1235, longitude: -97.0708 },
  { id: 16, name: "Psychology Building", address: "116 Psychology Building, Stillwater, OK 74078", latitude: 36.1248, longitude: -97.0724 },
  { id: 17, name: "OADDL (Animal Disease Diagnostic Lab)", address: "1950 W Farm Rd, Stillwater, OK 74078", latitude: 36.1210, longitude: -97.0860 },
  { id: 18, name: "Parker Hall", address: "201 Parker Hall, Stillwater, OK 74078", latitude: 36.1244, longitude: -97.0730 },
  { id: 19, name: "Physical Sciences", address: "145 Physical Sciences, Stillwater, OK 74078", latitude: 36.1246, longitude: -97.0715 },
  { id: 20, name: "Scott Hall", address: "201 Scott Hall, Stillwater, OK 74078", latitude: 36.1241, longitude: -97.0735 },
  { id: 21, name: "Seretean Wellness Center", address: "1514 W Hall of Fame Ave, Stillwater, OK 74078", latitude: 36.1271, longitude: -97.0739 },
  { id: 22, name: "Small Grains", address: "371 Agricultural Hall, Stillwater, OK 74078", latitude: 36.1240, longitude: -97.0726 },
  { id: 23, name: "Stout Hall", address: "201 Stout Hall, Stillwater, OK 74078", latitude: 36.1243, longitude: -97.0737 },
  { id: 24, name: "Student Health", address: "1202 W Farm Rd, Stillwater, OK 74078", latitude: 36.1225, longitude: -97.0732 },
  { id: 25, name: "Student Union", address: "100 S Hester St, Stillwater, OK 74078", latitude: 36.1252, longitude: -97.0720 },
  { id: 26, name: "USDA Facility", address: "1301 N Western Rd, Stillwater, OK 74075", latitude: 36.1330, longitude: -97.0860 },
  { id: 27, name: "Vet Med Teaching Hospital", address: "2065 W Farm Rd, Stillwater, OK 74078", latitude: 36.1212, longitude: -97.0865 },
  { id: 28, name: "Water Plant", address: "1006 W Farm Rd, Stillwater, OK 74078", latitude: 36.1220, longitude: -97.0850 },
  { id: 29, name: "Wentz Hall", address: "201 Wentz Hall, Stillwater, OK 74078", latitude: 36.1249, longitude: -97.0732 },
  { id: 30, name: "Willard Hall", address: "205 Willard Hall, Stillwater, OK 74078", latitude: 36.1245, longitude: -97.0728 },
  { id: 31, name: "Bartlesville B the Light", address: "219 N Virginia Ave, Bartlesville, OK", latitude: 36.7510, longitude: -95.9790 },
  { id: 32, name: "C3 - Cross Connection Church", address: "329 N Pesotum, Shawnee, OK", latitude: 35.3410, longitude: -96.9330 },
  { id: 33, name: "Checotah City Hall", address: "N Broadway, Checotah, OK", latitude: 35.4701, longitude: -95.5230 },
  { id: 34, name: "Claremore - Grace United Methodist Church", address: "9472 OK-20, Claremore, OK", latitude: 36.3126, longitude: -95.6161 },
  { id: 35, name: "Clinton Cheyenne & Arapaho ERC", address: "2105 Dogpatch Rd, Clinton, OK", latitude: 35.5150, longitude: -98.9670 },
  { id: 36, name: "Coalgate First Baptist Church", address: "106 West Hanover, Coalgate, OK", latitude: 34.5382, longitude: -96.2186 },
  { id: 37, name: "Concho Cheyenne & Arapaho ERC", address: "200 Wolf Robe Circle, Concho, OK", latitude: 35.6130, longitude: -97.9630 },
  { id: 38, name: "Elk City First Baptist Church", address: "1600 W Country Club Blvd, Elk City, OK", latitude: 35.4222, longitude: -99.4255 },
  { id: 39, name: "Enid Hope Outreach", address: "815 W Main, Enid, OK", latitude: 36.3956, longitude: -97.8784 },
  { id: 40, name: "Enid Salvation Army", address: "516 N Independence, Enid, OK", latitude: 36.3956, longitude: -97.8784 },
  { id: 41, name: "First Baptist Church of Boise City", address: "103 Cimarron Ave, Boise City, OK", latitude: 36.7290, longitude: -102.5130 },
  { id: 42, name: "Geary Cheyenne & Arapaho ERC", address: "132 E Main, Geary, OK", latitude: 35.6310, longitude: -98.3170 },
  { id: 43, name: "Grove Community Center", address: "104 W 3rd, Grove, OK", latitude: 36.5930, longitude: -94.7690 },
  { id: 44, name: "Hammon Cheyenne & Arapaho ERC", address: "20415 Hwy 33, Hammon, OK", latitude: 35.6260, longitude: -99.3830 },
  { id: 45, name: "Hands of Hope Food and Resource Center", address: "724 W Main St, Durant, OK", latitude: 33.9927, longitude: -96.3839 },
  { id: 46, name: "Higher Ground Church", address: "217 W Farrall St, Shawnee, OK", latitude: 35.3410, longitude: -96.9330 },
  { id: 47, name: "Hugo - Compassion of Christ Ministries", address: "301 W Main, Hugo, OK", latitude: 34.0107, longitude: -95.5097 },
  { id: 48, name: "Jay Community Center", address: "429 S 9th, Jay, OK", latitude: 36.4227, longitude: -94.8003 },
  { id: 49, name: "Kingfisher Cheyenne & Arapaho ERC", address: "400 W Erwin, Kingfisher, OK", latitude: 35.8614, longitude: -97.9317 },
  { id: 50, name: "Lawton Salvation Army Corps", address: "1306 SW E Ave, Lawton, OK", latitude: 34.6028, longitude: -98.4084 },
  { id: 51, name: "Ma Ma’s Christ Van", address: "601 W Broadway, Seminole, OK", latitude: 35.2240, longitude: -96.6700 },
  { id: 52, name: "Mayes County Fairgrounds", address: "2200 NE 1st St, Pryor, OK", latitude: 36.3072, longitude: -95.2932 },
  { id: 53, name: "Miami Main Attractions", address: "116 N Main, Miami, OK", latitude: 36.8740, longitude: -94.8770 },
  { id: 54, name: "Okmulgee First Free Will Baptist TruLife Center", address: "601 S Oklahoma, Okmulgee, OK", latitude: 35.6234, longitude: -95.9606 },
  { id: 55, name: "Pleasant Ridge Schoolhouse", address: "125 N Commercial Ave, Temple, OK", latitude: 34.2719, longitude: -98.2362 },
  { id: 56, name: "Pryor Impact Center of Oklahoma", address: "315 N Adair, Pryor, OK", latitude: 36.3084, longitude: -95.3169 },
  { id: 57, name: "Pryor Rescue Mission", address: "640 W Graham, Pryor, OK", latitude: 36.3095, longitude: -95.3282 },
  { id: 58, name: "Seiling Cheyenne & Arapaho ERC", address: "411 N Main, Seiling, OK", latitude: 36.1425, longitude: -98.9217 },
  { id: 59, name: "Stillwater Mission of Hope", address: "1804 S Perkins Rd, Stillwater, OK", latitude: 36.1024, longitude: -97.0514 },
  { id: 60, name: "Tahlequah First United Methodist Church", address: "300 W Delaware, Tahlequah, OK", latitude: 35.9146, longitude: -94.9741 },
  { id: 61, name: "Tulsa Metropolitan Area Command (Salvation Army)", address: "924 N Hudson Ave, Tulsa, OK", latitude: 36.1539, longitude: -95.9991 },
  { id: 62, name: "Vinita Day Center", address: "131 S Wilson St, Vinita, OK", latitude: 36.6382, longitude: -95.1548 },
  { id: 63, name: "Vinita Grand Mental Health", address: "405 E Excelsior, Vinita, OK", latitude: 36.6296, longitude: -95.1547 },
  { id: 64, name: "Watonga Cheyenne & Arapaho ERC", address: "257210 East Rd, Watonga, OK", latitude: 35.8440, longitude: -98.4130 },
  { id: 65, name: "West Siloam Springs Assembly of God", address: "5524 Cedar Dr, Colcord, OK", latitude: 36.1820, longitude: -94.6170 },
  { id: 66, name: "Woodward Cheyenne & Arapaho ERC", address: "43554 County Rd, Woodward, OK", latitude: 36.4337, longitude: -99.3904 }
];

// ---------- Distance Utility ----------
const distanceMiles = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
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

// ---------- Marker Component ----------
const ShelterMarker = ({ s, onPress }: { s: Shelter; onPress: (s: Shelter) => void }) => {
  const [freeze, setFreeze] = useState(false);
  const didLayout = useRef(false);

  return (
    <Marker
      coordinate={{ latitude: s.latitude, longitude: s.longitude }}
      title={s.name} // show title for accessibility
      description={s.address} // native callout fallback text
      tracksViewChanges={!freeze}
      anchor={{ x: 0.5, y: 0.5 }}
      calloutAnchor={{ x: 0.5, y: 0 }} // position callout above
    >
      {/* ✅ Custom home icon */}
      <View
        onLayout={() => {
          if (!didLayout.current) {
            didLayout.current = true;
            // Freeze icon after it renders once for perf
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
        <View style={{
          backgroundColor: '#fff',
          padding: 10,
          borderRadius: 8,
          width: 220,             
          borderWidth: 1,
          borderColor: '#ccc'
        }}>
          <Text style={{ fontWeight: 'bold', color: '#111' }}>{s.name}</Text>
          <Text style={{ color: '#333', fontSize: 12 }}>{s.address}</Text>
          <Text style={{ color: '#007AFF', fontSize: 11, marginTop: 4 }}>Tap for directions</Text>
        </View>
      </Callout>
    </Marker>
  );
};



// ---------- Main App ----------
export default function App() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [nearest10, setNearest10] = useState<Shelter[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [region, setRegion] = useState({
    latitude: 36.12,
    longitude: -97.07,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
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

  const openDirections = (s: Shelter) => {
    const url = Platform.select({
      ios: `maps://?daddr=${s.latitude},${s.longitude}`,
      android: `geo:0,0?q=${s.latitude},${s.longitude}(${s.name})`,
    });
    if (url) Linking.openURL(url);
  };

  // ---- Get User Location ----
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
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      );
    })();
    return () => subscription?.remove?.();
  }, []);

  // ---- Compute nearest shelters ----
  useEffect(() => {
    if (!userLocation) return;
    const updated = sheltersRaw.map((s) => ({
      ...s,
      _distance: distanceMiles(userLocation, { latitude: s.latitude, longitude: s.longitude }),
    }));
    setShelters(updated);
    setNearest10(
      [...updated].sort((a, b) => (a._distance ?? 0) - (b._distance ?? 0)).slice(0, 10)
    );
  }, [userLocation]);

  return (
    <View style={{ flex: 1 }}>
      {/* ---------- MAP ---------- */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        followsUserLocation
        mapType="standard"
      >
        {shelters.map((s) => (
          <ShelterMarker key={s.id} s={s} onPress={openDirections} />
        ))}
      </MapView>

      {/* ---------- Bottom Sheet ---------- */}
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
