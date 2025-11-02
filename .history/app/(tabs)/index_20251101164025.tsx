
// App.js - Main application file
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
  StatusBar,
  Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const App = () => {
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [region, setRegion] = useState({
    latitude: 36.1156,
    longitude: -97.0584,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const mapRef = useRef(null);
  const bottomSheetAnim = useRef(new Animated.Value(150)).current;
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Weather data
  const weatherData = {
    stormProbability: 65,
    windSpeed: 45,
    pressure: 29.8,
    humidity: 78,
    lastUpdate: '2 min ago'
  };

  // Shelter data - Stillwater, Oklahoma area
  const shelters = [
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
      accessible: true
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
      accessible: true
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
      accessible: false
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
      accessible: true
    }
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
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userCoords);
      setRegion({
        ...userCoords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
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

  const openDirections = (shelter) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    const url = Platform.select({
      ios: `${scheme}?daddr=${shelter.latitude},${shelter.longitude}`,
      android: `${scheme}0,0?q=${shelter.latitude},${shelter.longitude}(${shelter.name})`
    });
    Linking.openURL(url);
  };

  const callShelter = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getThreatColor = (probability) => {
    if (probability >= 70) return '#EF4444';
    if (probability >= 40) return '#F97316';
    if (probability >= 20) return '#EAB308';
    return '#10B981';
  };

  const getThreatText = (probability) => {
    if (probability >= 70) return 'SEVERE';
    if (probability >= 40) return 'HIGH';
    if (probability >= 20) return 'MODERATE';
    return 'LOW';
  };

  const focusOnShelter = (shelter) => {
    setSelectedShelter(shelter);
    mapRef.current?.animateToRegion({
      latitude: shelter.latitude,
      longitude: shelter.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* User Location Circle */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={500}
            fillColor="rgba(59, 130, 246, 0.2)"
            strokeColor="rgba(59, 130, 246, 0.5)"
            strokeWidth={2}
          />
        )}

        {/* Shelter Markers */}
        {shelters.map(shelter => {
          const occupancy = parseInt(shelter.occupants.split('/')[0]) / parseInt(shelter.occupants.split('/')[1]);
          const markerColor = occupancy > 0.7 ? '#EAB308' : '#10B981';
          
          return (
            <Marker
              key={shelter.id}
              coordinate={{
                latitude: shelter.latitude,
                longitude: shelter.longitude,
              }}
              pinColor={markerColor}
              onPress={() => focusOnShelter(shelter)}
            >
              <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
                <Ionicons name="home" size={20} color="white" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter your location..."
            value={searchInput}
            onChangeText={setSearchInput}
          />
        </View>

        {/* Status Bar */}
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

      {/* Weather Stats */}
      <View style={styles.weatherStats}>
        <Text style={styles.weatherTitle}>Weather Stats</Text>
        <View style={styles.weatherItem}>
          <View style={styles.weatherRow}>
            <Ionicons name="warning" size={14} color="#F97316" />
            <Text style={styles.weatherLabel}>Storm</Text>
          </View>
          <Text style={styles.weatherValue}>{weatherData.stormProbability}%</Text>
        </View>
        <View style={styles.weatherItem}>
          <View style={styles.weatherRow}>
            <Ionicons name="git-network" size={14} color="#6B7280" />
            <Text style={styles.weatherLabel}>Wind</Text>
          </View>
          <Text style={styles.weatherValue}>{weatherData.windSpeed} mph</Text>
        </View>
        <View style={styles.weatherItem}>
          <View style={styles.weatherRow}>
            <Ionicons name="water" size={14} color="#3B82F6" />
            <Text style={styles.weatherLabel}>Humid</Text>
          </View>
          <Text style={styles.weatherValue}>{weatherData.humidity}%</Text>
        </View>
        <View style={styles.weatherItem}>
          <Text style={styles.weatherLabel}>Pressure</Text>
          <Text style={styles.weatherValue}>{weatherData.pressure}"</Text>
        </View>
      </View>

      {/* Compass Button */}
      <TouchableOpacity 
        style={styles.compassButton}
        onPress={getUserLocation}
      >
        <Ionicons name="compass" size={24} color="#3B82F6" />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: bottomSheetAnim }]}>
        {/* Pull Tab */}
        <TouchableOpacity 
          style={styles.pullTab}
          onPress={toggleBottomSheet}
        >
          <View style={styles.pullIndicator} />
          <View style={styles.pullTabContent}>
            <Ionicons 
              name={sheetExpanded ? "chevron-down" : "chevron-up"} 
              size={20} 
              color="#6B7280" 
            />
            <Text style={styles.pullTabText}>
              {sheetExpanded ? 'Hide Shelters' : `View All Shelters (${shelters.length})`}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Content */}
        <ScrollView style={styles.sheetContent}>
          {!sheetExpanded ? (
            // Collapsed - Show nearest
            <View style={styles.collapsedContent}>
              <Text style={styles.nearestLabel}>NEAREST SHELTER</Text>
              <Text style={styles.nearestName}>{shelters[0].name}</Text>
              <View style={styles.nearestInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="navigate" size={12} color="#6B7280" />
                  <Text style={styles.infoText}>{shelters[0].distance}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time" size={12} color="#6B7280" />
                  <Text style={styles.infoText}>{shelters[0].time}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.goButton}
                onPress={() => openDirections(shelters[0])}
              >
                <Text style={styles.goButtonText}>Go</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Expanded - Show all
            <View style={styles.expandedContent}>
              <Text style={styles.expandedTitle}>Nearby Shelters</Text>
              {shelters.map((shelter, index) => (
                <View key={shelter.id} style={styles.shelterCard}>
                  {index === 0 && (
                    <View style={styles.closestBadge}>
                      <Text style={styles.closestText}>CLOSEST</Text>
                    </View>
                  )}
                  <Text style={styles.shelterName}>{shelter.name}</Text>
                  <Text style={styles.shelterAddress}>{shelter.address}</Text>
                  
                  <View style={styles.shelterStats}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Distance</Text>
                      <Text style={styles.statValue}>{shelter.distance}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Time</Text>
                      <Text style={styles.statValue}>{shelter.time}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Capacity</Text>
                      <Text style={styles.statValue}>{shelter.occupants}</Text>
                    </View>
                  </View>

                  <View style={styles.shelterActions}>
                    <TouchableOpacity 
                      style={styles.directionsButton}
                      onPress={() => openDirections(shelter)}
                    >
                      <Ionicons name="navigate" size={14} color="white" />
                      <Text style={styles.directionsButtonText}>Directions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.callButton}
                      onPress={() => callShelter(shelter.phone)}
                    >
                      <Ionicons name="call" size={16} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.infoButton}
                      onPress={() => focusOnShelter(shelter)}
                    >
                      <Text style={styles.infoButtonText}>Info</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Shelter Info Modal */}
      {selectedShelter && !sheetExpanded && (
        <View style={styles.shelterModal}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedShelter(null)}
          >
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>{selectedShelter.name}</Text>
          <Text style={styles.modalAddress}>{selectedShelter.address}</Text>
          
          <View style={styles.modalStats}>
            <View style={styles.modalStatItem}>
              <Ionicons name="navigate" size={16} color="#3B82F6" />
              <Text style={styles.modalStatValue}>{selectedShelter.distance}</Text>
              <Text style={styles.modalStatLabel}>{selectedShelter.time}</Text>
            </View>
            <View style={styles.modalStatItem}>
              <Ionicons name="people" size={16} color="#10B981" />
              <Text style={styles.modalStatValue}>{selectedShelter.occupants}</Text>
              <Text style={styles.modalStatLabel}>Capacity</Text>
            </View>
            <View style={styles.modalStatItem}>
              <Ionicons name="call" size={16} color="#F97316" />
              <Text style={styles.modalStatValue}>{selectedShelter.phone.slice(0, 3)}-{selectedShelter.phone.slice(3, 6)}</Text>
              <Text style={styles.modalStatLabel}>{selectedShelter.phone.slice(6)}</Text>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalDirectionsButton}
              onPress={() => openDirections(selectedShelter)}
            >
              <Ionicons name="navigate" size={16} color="white" />
              <Text style={styles.modalDirectionsText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCallButton}
              onPress={() => callShelter(selectedShelter.phone)}
            >
              <Ionicons name="call" size={16} color="white" />
              <Text style={styles.modalCallText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  map: {
    flex: 1,
  },
  topSection: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 8,
    flex: 1,
  },
  statusTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusSubtitle: {
    color: 'white',
    fontSize: 10,
    opacity: 0.9,
  },
  statusPercentage: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  weatherStats: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 200 : 170,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#374151',
    marginBottom: 8,
  },
  weatherItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  weatherValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  compassButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 360 : 330,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  pullTab: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pullIndicator: {
    width: 48,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 8,
  },
  pullTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pullTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  sheetContent: {
    flex: 1,
  },
  collapsedContent: {
    padding: 16,
  },
  nearestLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  nearestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  nearestInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  goButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  goButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  expandedContent: {
    padding: 16,
  },
  expandedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  shelterCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closestBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  closestText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shelterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  shelterAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  shelterStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  shelterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  directionsButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  directionsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  callButton: {
    backgroundColor: '#E5E7EB',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: '#E5E7EB',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shelterModal: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    paddingRight: 32,
  },
  modalAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  modalStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalDirectionsButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  modalDirectionsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCallButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  modalCallText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App;
