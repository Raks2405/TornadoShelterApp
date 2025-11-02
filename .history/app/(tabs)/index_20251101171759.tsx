// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// NEW



const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

type LocationCoords = {
  latitude: number;
  longitude: number;
};

const App: React.FC = () => {
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [region, setRegion] = useState<Region>({
    latitude: 36.1156,
    longitude: -97.0584,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const mapRef = useRef<MapView | null>(null);
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const weatherData = {
    stormProbability: 65,
    windSpeed: 45,
    pressure: 29.8,
    humidity: 78,
    lastUpdate: '2 min ago',
  };

  const shelters: Shelter[] = [
    {
      id: 1,
      name: 'OSU Colvin Center',
      latitude: 36.1251,
      longitude: -97.0782,
      distance: '0.8 mi',
      time: '3 min',
      occupants: '127/500',
      phone: '4057447678',
      address: '4646 W Hall of Fame Ave',
      accessible: true,
    },
    {
      id: 2,
      name: 'Stillwater Public Library',
      latitude: 36.1156,
      longitude: -97.0584,
      distance: '1.2 mi',
      time: '5 min',
      occupants: '45/200',
      phone: '4053723633',
      address: '1107 S Duck St',
      accessible: true,
    },
    {
      id: 3,
      name: 'City Hall Emergency Shelter',
      latitude: 36.1169,
      longitude: -97.0586,
      distance: '1.5 mi',
      time: '6 min',
      occupants: '89/300',
      phone: '4057428200',
      address: '723 S Lewis St',
      accessible: false,
    },
    {
      id: 4,
      name: 'Westminster Presbyterian Church',
      latitude: 36.1289,
      longitude: -97.0689,
      distance: '1.8 mi',
      time: '7 min',
      occupants: '34/150',
      phone: '4053722371',
      address: '1226 W 6th Ave',
      accessible: true,
    },
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your position');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const coords: LocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const toggleBottomSheet = () => {
    const toValue = sheetExpanded ? 150 : SCREEN_HEIGHT * 0.6;
    Animated.spring(bottomSheetAnim, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
    setSheetExpanded(!sheetExpanded);
  };

  const openDirections = (shelter: Shelter) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `${scheme}?daddr=${shelter.latitude},${shelter.longitude}`,
      android: `${scheme}0,0?q=${shelter.latitude},${shelter.longitude}(${shelter.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const callShelter = (phone: string) => Linking.openURL(`tel:${phone}`);

  const getThreatColor = (p: number) =>
    p >= 70 ? '#EF4444' : p >= 40 ? '#F97316' : p >= 20 ? '#EAB308' : '#10B981';
  const getThreatText = (p: number) =>
    p >= 70 ? 'SEVERE' : p >= 40 ? 'HIGH' : p >= 20 ? 'MODERATE' : 'LOW';

  const focusOnShelter = (shelter: Shelter) => {
    setSelectedShelter(shelter);
    mapRef.current?.animateToRegion(
      { latitude: shelter.latitude, longitude: shelter.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#000000ff"  translucent={false} />
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
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
        {shelters.map((s) => {
          const occ = parseInt(s.occupants.split('/')[0]) / parseInt(s.occupants.split('/')[1]);
          const color = occ > 0.7 ? '#EAB308' : '#10B981';
          return (
            <Marker key={s.id} coordinate={{ latitude: s.latitude, longitude: s.longitude }} onPress={() => focusOnShelter(s)}>
              <View style={[styles.customMarker, { backgroundColor: color }]}>
                <Ionicons name="home" size={20} color="white" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Enter your location..." value={searchInput} onChangeText={setSearchInput} />
        </View>
        <View style={[styles.statusBar, { backgroundColor: getThreatColor(weatherData.stormProbability) }]}>
          <View style={styles.statusLeft}>
            <Ionicons name="warning" size={20} color="white" />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                TORNADO THREAT: {getThreatText(weatherData.stormProbability)}
              </Text>
              <Text style={styles.statusSubtitle}>Updated {weatherData.lastUpdate}</Text>
            </View>
          </View>
          <Text style={styles.statusPercentage}>{weatherData.stormProbability}%</Text>
        </View>
      </View>

      {/* Bottom Sheet with Scroll */}
      <Animated.View style={[styles.bottomSheet, { height: bottomSheetAnim }]}>
        <TouchableOpacity style={styles.pullTab} onPress={toggleBottomSheet}>
          <View style={styles.pullIndicator} />
          <View style={styles.pullTabContent}>
            <Ionicons name={sheetExpanded ? 'chevron-down' : 'chevron-up'} size={20} color="#6B7280" />
            <Text style={styles.pullTabText}>
              {sheetExpanded ? 'Hide Shelters' : `View All Shelters (${shelters.length})`}
            </Text>
          </View>
        </TouchableOpacity>

        <ScrollView style={styles.sheetContent}>
          {shelters.map((s) => (
            <View key={s.id} style={styles.shelterCard}>
              <Text style={styles.shelterName}>{s.name}</Text>
              <Text style={styles.shelterAddress}>{s.address}</Text>
              <View style={styles.shelterStats}>
                <Text style={styles.shelterText}>Distance: {s.distance}</Text>
                <Text style={styles.shelterText}>Time: {s.time}</Text>
                <Text style={styles.shelterText}>Capacity: {s.occupants}</Text>
              </View>
              <View style={styles.shelterButtons}>
                <TouchableOpacity style={styles.directionsButton} onPress={() => openDirections(s)}>
                  <Ionicons name="navigate" size={16} color="white" />
                  <Text style={styles.buttonText}>Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callButton} onPress={() => callShelter(s.phone)}>
                  <Ionicons name="call" size={16} color="white" />
                  <Text style={styles.buttonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  map: { flex: 1 },
  customMarker: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  topSection: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 16, right: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusText: { marginLeft: 8, flex: 1 },
  statusTitle: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  statusSubtitle: { color: 'white', fontSize: 10, opacity: 0.9 },
  statusPercentage: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
  pullTab: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pullIndicator: { width: 48, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, marginBottom: 8 },
  pullTabContent: { flexDirection: 'row', alignItems: 'center' },
  pullTabText: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 4 },
  sheetContent: { padding: 16 },
  shelterCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  shelterName: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  shelterAddress: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  shelterStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  shelterText: { fontSize: 12, color: '#111827' },
  shelterButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  directionsButton: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 10, borderRadius: 8, marginRight: 8 },
  callButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 10, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 12, marginLeft: 4 },
});

export default App;
