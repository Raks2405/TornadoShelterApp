import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import * as Device from "expo-device";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ---------- Notification handler ----------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  gusts: number;
};

const sheltersRaw: Shelter[] = [
  { id: 1, name: "ATRC (Advanced Technology Research Center)", address: "111 Engineering North, Stillwater, OK 74078", latitude: 36.12378385982384, longitude: -97.06825102053767 },
  { id: 2, name: "Business (Spears School of Business)", address: "294 Business Building, Stillwater, OK 74078", latitude: 36.12274776284977, longitude: -97.06744602204951 },
  { id: 3, name: "Classroom Building", address: "200 S Monroe St, Stillwater, OK 74078", latitude: 36.122583103341285, longitude: -97.06887832147167 },
  { id: 4, name: "Dairy Barn", address: "520 S Monroe St, Stillwater, OK 74078", latitude: 36.132019295945, longitude: -97.09291386376337 },
  { id: 5, name: "Engineering North", address: "111 Engineering North, Stillwater, OK 74078", latitude: 36.1239678599741, longitude: -97.06906107787879 },
  { id: 6, name: "Gallagher-Iba Arena", address: "200 Athletics Center, Stillwater, OK 74078", latitude: 36.12632809068782, longitude: -97.06513737973837 },
  { id: 7, name: "General Academic Building (GAB)", address: "720 W Hall of Fame Ave, Stillwater, OK 74078", latitude: 36.12228729222502, longitude: -97.0673940643781 },
  { id: 8, name: "Iba Hall", address: "123 Iba Hall, Stillwater, OK 74078", latitude: 36.12501236223827, longitude: -97.07478347788484 },
  { id: 9, name: "Legacy Hall", address: "377 N Hester St, Stillwater, OK 74078", latitude: 36.12798474709971, longitude: -97.07177986905464 },
  { id: 10, name: "Edmon Low Library", address: "216 Edmon Low Library, Stillwater, OK 74078", latitude: 36.12319489231584, longitude: -97.0695938337139 },
  { id: 11, name: "Life Sciences East & West", address: "111 Life Sciences East, Stillwater, OK 74078", latitude: 36.123392677320076, longitude: -97.07057194187088 },
  { id: 12, name: "Math Sciences", address: "401 Math Sciences, Stillwater, OK 74078", latitude: 36.12241662456105, longitude: -97.07145844411707 },
  { id: 13, name: "McElroy Hall", address: "206 McElroy Hall, Stillwater, OK 74078", latitude: 36.12400935712181, longitude: -97.08188558694047 },
  { id: 14, name: "Nancy Randolph Davis Building", address: "315 Nancy Randolph Davis, Stillwater, OK 74078", latitude: 36.12272792694161, longitude: -97.07258193555532 },
  { id: 15, name: "Noble Research Center", address: "135 Noble Research Center, Stillwater, OK 74078", latitude: 36.12501972638019, longitude: -97.0701297220533 },
  { id: 16, name: "Psychology Building", address: "116 Psychology Building, Stillwater, OK 74078", latitude: 36.12110856238142, longitude: -97.07259755089268 },
  { id: 17, name: "OADDL (Animal Disease Diagnostic Lab)", address: "1950 W Farm Rd, Stillwater, OK 74078", latitude: 36.12524352028413, longitude: -97.08296667417783 },
  { id: 18, name: "Parker Hall", address: "201 Parker Hall, Stillwater, OK 74078", latitude: 36.12228622970452, longitude: -97.07366313555973 },
  { id: 19, name: "Physical Sciences", address: "145 Physical Sciences, Stillwater, OK 74078", latitude: 36.12418929352478, longitude: -97.07030039322969 },
  { id: 20, name: "Scott Hall", address: "201 Scott Hall, Stillwater, OK 74078", latitude: 36.121892097415035, longitude: -97.07437250672615 },
  { id: 21, name: "Seretean Wellness Center", address: "1514 W Hall of Fame Ave, Stillwater, OK 74078", latitude: 36.12641982938849, longitude: -97.0782076067265 },
  { id: 22, name: "Small Grains", address: "371 Agricultural Hall, Stillwater, OK 74078", latitude: 36.1240337020512, longitude: -97.0722477020213 },
  { id: 23, name: "Stout Hall", address: "201 Stout Hall, Stillwater, OK 74078", latitude: 36.120212632814244, longitude: -97.07357465089954 },
  { id: 24, name: "Student Health", address: "1202 W Farm Rd, Stillwater, OK 74078", latitude: 36.124915405670556, longitude: -97.07396675088751 },
  { id: 25, name: "Student Union", address: "100 S Hester St, Stillwater, OK 74078", latitude: 36.1211469799106, longitude: -97.06856862411276 },
  { id: 26, name: "USDA Facility", address: "1301 N Western Rd, Stillwater, OK 74075", latitude: 36.13547679919201, longitude: -97.08632708172537 },
  { id: 27, name: "Vet Med Teaching Hospital", address: "2065 W Farm Rd, Stillwater, OK 74078", latitude: 36.12403499684928, longitude: -97.08440026254173 },
  { id: 28, name: "Water Plant", address: "1006 W Farm Rd, Stillwater, OK 74078", latitude: 36.12167932469615, longitude: -97.09724462562775 },
  { id: 29, name: "Wentz Hall", address: "201 Wentz Hall, Stillwater, OK 74078", latitude: 36.12212506634851, longitude: -97.07488102020999 },
  { id: 30, name: "Willard Hall", address: "205 Willard Hall, Stillwater, OK 74078", latitude: 36.121489429964534, longitude: -97.07119199322335 },
  { id: 31, name: "Bartlesville B the Light", address: "219 N Virginia Ave, Bartlesville, OK", latitude: 36.76866151413501, longitude: -95.98975256734218 },
  { id: 32, name: "C3 - Cross Connection Church", address: "329 N Pesotum, Shawnee, OK", latitude: 35.331197058491, longitude: -96.9030274778854 },
  { id: 33, name: "Checotah City Hall", address: "N Broadway, Checotah, OK", latitude: 35.47130478611472, longitude: -95.52294513185187 },
  { id: 34, name: "Claremore - Grace United Methodist Church", address: "9472 OK-20, Claremore, OK", latitude: 36.30678602961172, longitude: -95.65913812207064 },
  { id: 35, name: "Clinton Cheyenne & Arapaho ERC", address: "2105 Dogpatch Rd, Clinton, OK", latitude: 35.516555361718524, longitude: -98.9376143434932 },
  { id: 36, name: "Coalgate First Baptist Church", address: "106 West Hanover, Coalgate, OK", latitude: 34.53738081027064, longitude: -96.21973224111589 },
  { id: 37, name: "Concho Cheyenne & Arapaho ERC", address: "200 Wolf Robe Circle, Concho, OK", latitude: 35.51652916358124, longitude: -98.93766798766742 },
  { id: 38, name: "Elk City First Baptist Church", address: "1600 W Country Club Blvd, Elk City, OK", latitude: 35.42094490000072, longitude: -99.42468176439826 },
  { id: 39, name: "Enid Hope Outreach", address: "815 W Main, Enid, OK", latitude: 36.395497866221454, longitude: -97.88869158559615 },
  { id: 40, name: "Enid Salvation Army", address: "516 N Independence, Enid, OK", latitude: 36.402087347411054, longitude: -97.88003970115648 },
  { id: 41, name: "First Baptist Church of Boise City", address: "103 Cimarron Ave, Boise City, OK", latitude: 36.73082839601053, longitude: -102.51339351835452 },
  { id: 42, name: "Geary Cheyenne & Arapaho ERC", address: "132 E Main, Geary, OK", latitude: 35.51667761958329, longitude: -98.93759288582797 },
  { id: 43, name: "Grove Community Center", address: "104 W 3rd, Grove, OK", latitude: 36.59284754228951, longitude: -94.7710246643715 },
  { id: 44, name: "Hammon Cheyenne & Arapaho ERC", address: "20415 Hwy 33, Hammon, OK", latitude: 35.51654662900266, longitude: -98.93768944533042 },
  { id: 45, name: "Hands of Hope Food and Resource Center", address: "724 W Main St, Durant, OK", latitude: 33.99307958824874, longitude: -96.38390743370093 },
  { id: 46, name: "Higher Ground Church", address: "217 W Farrall St, Shawnee, OK", latitude: 35.33087772946314, longitude: -96.9237017890569 },
  { id: 47, name: "Hugo - Compassion of Christ Ministries", address: "301 W Main, Hugo, OK", latitude: 34.0109711065414, longitude: -95.50840634904071 },
  { id: 48, name: "Jay Community Center", address: "429 S 9th, Jay, OK", latitude: 36.59563470900546, longitude: -94.77907368697055 },
  { id: 49, name: "Kingfisher Cheyenne & Arapaho ERC", address: "400 W Erwin, Kingfisher, OK", latitude: 35.85622748591108, longitude: -97.93704556199692 },
  { id: 50, name: "Lawton Salvation Army Corps", address: "1306 SW E Ave, Lawton, OK", latitude: 34.60272610989292, longitude: -98.40817913569181 },
  { id: 51, name: "Ma Ma’s Christ Van", address: "601 W Broadway, Seminole, OK", latitude: 35.22467772869555, longitude: -96.67737057786745 },
  { id: 52, name: "Mayes County Fairgrounds", address: "2200 NE 1st St, Pryor, OK", latitude: 36.306726883711555, longitude: -95.28761356438471 },
  { id: 53, name: "Miami Main Attractions", address: "116 N Main, Miami, OK", latitude: 36.87678831148298, longitude: -94.87722143554127 },
  { id: 54, name: "Okmulgee First Free Will Baptist TruLife Center", address: "601 S Oklahoma, Okmulgee, OK", latitude: 35.61790851677125, longitude: -95.97952712020307 },
  { id: 55, name: "Pleasant Ridge Schoolhouse", address: "125 N Commercial Ave, Temple, OK", latitude: 34.310975588514765, longitude: -98.23824761046377 },
  { id: 56, name: "Pryor Impact Center of Oklahoma", address: "315 N Adair, Pryor, OK", latitude: 36.313124626095515, longitude: -95.31503110671156 },
  { id: 57, name: "Pryor Rescue Mission", address: "640 W Graham, Pryor, OK", latitude: 36.30926048259121, longitude: -95.3274007643963 },
  { id: 58, name: "Seiling Cheyenne & Arapaho ERC", address: "411 N Main, Seiling, OK", latitude: 35.516537896291254, longitude: -98.93770017416644 },
  { id: 59, name: "Stillwater Mission of Hope", address: "1804 S Perkins Rd, Stillwater, OK", latitude: 36.103223342187775, longitude: -97.0516069643914 },
  { id: 60, name: "Tahlequah First United Methodist Church", address: "300 W Delaware, Tahlequah, OK", latitude: 35.91472990271358, longitude: -94.97382146439938 },
  { id: 61, name: "Tulsa Metropolitan Area Command (Salvation Army)", address: "924 N Hudson Ave, Tulsa, OK", latitude: 36.14868919763435, longitude: -95.91381821650737 },
  { id: 62, name: "Vinita Day Center", address: "131 S Wilson St, Vinita, OK", latitude: 36.63778141815794, longitude: -95.15519186439303 },
  { id: 63, name: "Vinita Grand Mental Health", address: "405 E Excelsior, Vinita, OK", latitude: 36.629687849917765, longitude: -95.15495125089511 },
  { id: 64, name: "Watonga Cheyenne & Arapaho ERC", address: "257210 East Rd, Watonga, OK", latitude: 35.51663395608318, longitude: -98.93768944534642 },
  { id: 65, name: "West Siloam Springs Assembly of God", address: "5524 Cedar Dr, Colcord, OK", latitude: 36.176911763327944, longitude: -94.60179882204861 },
  { id: 66, name: "Woodward Cheyenne & Arapaho ERC", address: "43554 County Rd, Woodward, OK", latitude: 35.51658140896709, longitude: -98.9376841196296 }
];

// ---------- Distance Utility ----------
const distanceMiles = (a: LocationCoords, b: LocationCoords) => {
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
      title={`🧭 ${s.name}`}
      description={`${s.address}\nTap to open Maps`}
      onCalloutPress={() => onPress(s)}
      tracksViewChanges={!freeze}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{ position: "relative" }}>
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
        <View
          style={{
            position: "absolute",
            right: -2,
            top: -2,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "#3B82F6",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#fff",
          }}
          pointerEvents="none"
        >
          <Ionicons name="navigate" size={10} color="#fff" />
        </View>
      </View>
    </Marker>
  );
};

// ---------- Main ----------
export default function App() {
  const lastAlertRef = useRef("");
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
    gusts: 0,
    lastUpdate: "—",
  });
  const [updateTick, setUpdateTick] = useState(0);
  const SERVER_URL = "https://tornado-push-server.onrender.com";

  const mapRef = useRef<MapView | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [expanded, setExpanded] = useState(false);

  // ---------- Ask for permissions ----------
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") console.warn("Notification permission not granted!");
    })();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for incoming notifications while app is open
    const listener = Notifications.addNotificationReceivedListener((notif) => {
      console.log("📨 Notification received:", notif.request.content);
    });

    return () => listener.remove();
  }, []);

  // ---------- Tornado Fetch ----------
  useEffect(() => {
    const getWeather = async () => {
      //const data = await fetchTornadoIndicators(region.latitude, region.longitude)
      const data = {
        threat: "HIGH", // for testing
        wind: 12,
        probability: 75,
        pressure: 1005,
        gusts: 18,
      };

      // Animate flicker to show UI refresh
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.6, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      if (!data) return;

      setWeatherData({
        stormProbability: data.probability,
        windSpeed: data.wind,
        pressure: data.pressure,
        gusts: data.gusts,
        lastUpdate: new Date().toLocaleTimeString(),
      });
      setUpdateTick((t) => t + 1);
    };

    getWeather();
    const interval = setInterval(getWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [region]);

  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      Alert.alert("Push notifications only work on physical devices!");
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Permission not granted for notifications");
      return null;
    }

    // Get Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    console.log("📱 Expo Push Token:", token);

    // Send to Render server
    try {
      const response = await fetch(`${SERVER_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to register token");
      console.log("✅ Token registered successfully on backend");
    } catch (err) {
      console.error("❌ Error registering token:", err);
    }

    // Android notification channel setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  // ---------- Notification trigger when weather changes ----------
  useEffect(() => {
    const threat =
      weatherData.stormProbability >= 70
        ? "SEVERE"
        : weatherData.stormProbability >= 40
          ? "HIGH"
          : "LOW";

    if ((threat === "HIGH" || threat === "SEVERE") && lastAlertRef.current !== threat) {
      lastAlertRef.current = threat;

      Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Tornado Alert: ${threat}`,
          body: `Wind: ${(weatherData.windSpeed * 2.237).toFixed(
            1
          )} mph | Gusts: ${(weatherData.gusts * 2.237).toFixed(
            1
          )} mph | Pressure: ${weatherData.pressure} hPa`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    }
  }, [weatherData]);

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
        (pos) =>
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
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

  // ---------- UI helpers ----------
  const getThreatColor = (p: number) =>
    p >= 70 ? "#EF4444" : p >= 40 ? "#F97316" : p >= 20 ? "#EAB308" : "#10B981";
  const getThreatText = (p: number) =>
    p >= 70 ? "SEVERE" : p >= 40 ? "HIGH" : p >= 20 ? "MODERATE" : "LOW";
  const getThreatSymbol = (p: number) =>
    p >= 70 ? "warning" : p >= 40 ? "alert-sharp" : p >= 20 ? "alarm-sharp" : "happy";

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
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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

      {/* Tornado Alert Banner */}
      <View
        style={[
          styles.statusBar,
          { backgroundColor: getThreatColor(weatherData.stormProbability) },
        ]}
      >
        <View style={styles.statusLeft}>
          <Ionicons name={getThreatSymbol(weatherData.stormProbability)} size={20} color="white" />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              TORNADO THREAT: {getThreatText(weatherData.stormProbability)}
            </Text>
            <Text style={styles.statusSubtitle}>Updated {weatherData.lastUpdate}</Text>
          </View>
        </View>
        <Text style={styles.statusPercentage}>{weatherData.stormProbability}%</Text>
      </View>

      {/* Weather Stats Panel */}
      <View style={styles.weatherStatsPanel}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.weatherStatsTitle}>Weather Stats</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statLabelContainer}>
              <Ionicons name="alert-circle" size={12} color="#6B7280" />
              <Text style={styles.statLabel}>Storm</Text>
            </View>
            <Text style={[styles.statValue, { color: "#F97316" }]}>
              {weatherData.stormProbability}%
            </Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLabelContainer}>
              <Ionicons name="thunderstorm" size={12} color="#6B7280" />
              <Text style={styles.statLabel}>Wind</Text>
            </View>
            <Text style={styles.statValue}>{(weatherData.windSpeed * 2.237).toFixed(1)} mph</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLabelContainer}>
              <Ionicons name="water" size={12} color="#6B7280" />
              <Text style={styles.statLabel}>Gusts</Text>
            </View>
            <Text style={styles.statValue}>{(weatherData.gusts * 2.237).toFixed(1)} mph</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLabelContainer}>
              <Ionicons name="barbell" size={12} color="#6B7280" />
              <Text style={styles.statLabel}>Pressure</Text>
            </View>
            <Text style={styles.statValue}>{(weatherData.pressure * 0.02953).toFixed(2)}"</Text>
          </View>
        </View>
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
    </Animated.View>
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
  weatherStatsPanel: {
    position: "absolute",
    top: 110,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    width: 144,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  weatherStatsTitle: { fontWeight: "bold", fontSize: 12, color: "#374151", marginBottom: 8 },
  statsContainer: { gap: 8 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statLabelContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  statLabel: { fontSize: 12, color: "#6B7280" },
  statValue: { fontSize: 12, fontWeight: "bold", color: "#111827" },
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
  pull: { alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 10 },
  indicator: { width: 50, height: 4, borderRadius: 2, backgroundColor: "#ccc", marginBottom: 4 },
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
