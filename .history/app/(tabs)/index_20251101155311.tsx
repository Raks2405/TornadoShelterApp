import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Shelter = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  distance: string;
  time: string;
  occupants: string;
  phone: string;
  address: string;
  accessible: boolean;
};

const { width, height } = Dimensions.get('window');

const TornadoShelterApp: React.FC = () => {
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');

  // Weather data
  const weatherData = {
    stormProbability: 65,
    windSpeed: 45,
    pressure: 29.8,
    humidity: 78,
    lastUpdate: '2 min ago',
  };

  // Shelter data
  const shelters: Shelter[] = [
    {
      id: 1,
      name: 'OSU Colvin Center',
      lat: 36.1251,
      lng: -97.0782,
      distance: '0.8 mi',
      time: '3 min',
      occupants: '127/500',
      phone: '(405) 744-7678',
      address: '4646 W Hall of Fame Ave',
      accessible: true,
    },
    {
      id: 2,
      name: 'Stillwater Public Library',
      lat: 36.1156,
      lng: -97.0584,
      distance: '1.2 mi',
      time: '5 min',
      occupants: '45/200',
      phone: '(405) 372-3633',
      address: '1107 S Duck St',
      accessible: true,
    },
    {
      id: 3,
      name: 'City Hall Emergency Shelter',
      lat: 36.1169,
      lng: -97.0586,
      distance: '1.5 mi',
      time: '6 min',
      occupants: '89/300',
      phone: '(405) 742-8200',
      address: '723 S Lewis St',
      accessible: false,
    },
    {
      id: 4,
      name: 'Westminster Presbyterian Church',
      lat: 36.1289,
      lng: -97.0689,
      distance: '1.8 mi',
      time: '7 min',
      occupants: '34/150',
      phone: '(405) 372-2371',
      address: '1226 W 6th Ave',
      accessible: true,
    },
  ];

  const getThreatColor = (probability: number): string => {
    if (probability >= 70) return '#ef4444';
    if (probability >= 40) return '#f97316';
    if (probability >= 20) return '#eab308';
    return '#22c55e';
  };

  const getThreatText = (probability: number): string => {
    if (probability >= 70) return 'SEVERE';
    if (probability >= 40) return 'HIGH';
    if (probability >= 20) return 'MODERATE';
    return 'LOW';
  };

  const openMaps = (lat: number, lng: number): void => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${lat},${lng}`;
    const label = 'Shelter';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  const makeCall = (phoneNumber: string): void => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter your location..."
            value={searchInput}
            onChangeText={setSearchInput}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Tornado Threat Bar */}
        <View
          style={[
            styles.statusBar,
            { backgroundColor: getThreatColor(weatherData.stormProbability) },
          ]}>
          <View style={styles.statusLeft}>
            <Ionicons name="warning" size={20} color="white" />
            <View style={styles.statusTextContainer}>
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
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color="#d1d5db" />
          <Text style={styles.mapPlaceholderText}>Integrate React Native Maps</Text>
          <Text style={styles.mapPlaceholderSubtext}>Centered on Oklahoma</Text>
        </View>

        {/* Compass */}
        <View style={styles.compass}>
          <MaterialCommunityIcons name="compass" size={24} color="#2563eb" />
        </View>

        {/* Weather Stats */}
        <View style={styles.weatherStats}>
          <Text style={styles.weatherStatsTitle}>Weather Stats</Text>
          <View style={styles.weatherStatRow}>
            <View style={styles.weatherStatLabel}>
              <Ionicons name="warning" size={12} color="#6b7280" />
              <Text style={styles.weatherStatText}>Storm</Text>
            </View>
            <Text style={styles.weatherStatValue}>
              {weatherData.stormProbability}%
            </Text>
          </View>
          <View style={styles.weatherStatRow}>
            <View style={styles.weatherStatLabel}>
              <Ionicons name="cloudy" size={12} color="#6b7280" />
              <Text style={styles.weatherStatText}>Wind</Text>
            </View>
            <Text style={styles.weatherStatValue}>{weatherData.windSpeed} mph</Text>
          </View>
          <View style={styles.weatherStatRow}>
            <View style={styles.weatherStatLabel}>
              <Ionicons name="water" size={12} color="#6b7280" />
              <Text style={styles.weatherStatText}>Humid</Text>
            </View>
            <Text style={styles.weatherStatValue}>{weatherData.humidity}%</Text>
          </View>
          <View style={styles.weatherStatRow}>
            <Text style={styles.weatherStatText}>Pressure</Text>
            <Text style={styles.weatherStatValue}>{weatherData.pressure}"</Text>
          </View>
        </View>

        {/* Shelter Info Popup */}
        {selectedShelter && (
          <View style={styles.shelterPopup}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedShelter(null)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.shelterPopupName}>{selectedShelter.name}</Text>
            <Text style={styles.shelterPopupAddress}>
              {selectedShelter.address}
            </Text>

            <View style={styles.shelterPopupStats}>
              <View style={styles.shelterPopupStat}>
                <Ionicons name="navigate" size={16} color="#2563eb" />
                <Text style={styles.shelterPopupStatValue}>
                  {selectedShelter.distance}
                </Text>
                <Text style={styles.shelterPopupStatLabel}>
                  {selectedShelter.time}
                </Text>
              </View>
              <View style={styles.shelterPopupStat}>
                <Ionicons name="people" size={16} color="#22c55e" />
                <Text style={styles.shelterPopupStatValue}>
                  {selectedShelter.occupants}
                </Text>
                <Text style={styles.shelterPopupStatLabel}>Capacity</Text>
              </View>
              <View style={styles.shelterPopupStat}>
                <Ionicons name="call" size={16} color="#f97316" />
                <Text style={[styles.shelterPopupStatValue, { fontSize: 10 }]}>
                  {selectedShelter.phone.slice(0, 9)}
                </Text>
                <Text style={styles.shelterPopupStatLabel}>
                  {selectedShelter.phone.slice(9)}
                </Text>
              </View>
            </View>

            <View style={styles.shelterPopupButtons}>
              <TouchableOpacity
                style={[styles.shelterPopupButton, styles.directionsButton]}
                onPress={() => openMaps(selectedShelter.lat, selectedShelter.lng)}>
                <Ionicons name="navigate" size={16} color="white" />
                <Text style={styles.shelterPopupButtonText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shelterPopupButton, styles.callButton]}
                onPress={() => makeCall(selectedShelter.phone)}>
                <Ionicons name="call" size={16} color="white" />
                <Text style={styles.shelterPopupButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <View
        style={[
          styles.bottomSheet,
          { height: bottomSheetExpanded ? height * 0.65 : 120 },
        ]}>
        <TouchableOpacity
          style={styles.bottomSheetHandle}
          onPress={() => setBottomSheetExpanded(!bottomSheetExpanded)}>
          <View style={styles.handleBar} />
          <View style={styles.handleContent}>
            <Ionicons
              name={bottomSheetExpanded ? 'chevron-down' : 'chevron-up'}
              size={20}
              color="#6b7280"
            />
            <Text style={styles.handleText}>
              {bottomSheetExpanded
                ? 'Hide Shelters'
                : `View All Shelters (${shelters.length})`}
            </Text>
          </View>
        </TouchableOpacity>

        {!bottomSheetExpanded ? (
          <View style={styles.collapsedView}>
            <View style={styles.nearestShelterInfo}>
              <View>
                <Text style={styles.nearestLabel}>NEAREST SHELTER</Text>
                <Text style={styles.nearestName}>{shelters[0].name}</Text>
                <View style={styles.nearestStats}>
                  <View style={styles.nearestStat}>
                    <Ionicons name="navigate" size={12} color="#6b7280" />
                    <Text style={styles.nearestStatText}>
                      {shelters[0].distance}
                    </Text>
                  </View>
                  <View style={styles.nearestStat}>
                    <Ionicons name="time" size={12} color="#6b7280" />
                    <Text style={styles.nearestStatText}>
                      {shelters[0].time}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.goButton}
                onPress={() => openMaps(shelters[0].lat, shelters[0].lng)}>
                <Text style={styles.goButtonText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.expandedView}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.expandedTitle}>Nearby Shelters</Text>

            {shelters.map((shelter, index) => (
              <View key={shelter.id} style={styles.shelterCard}>
                <View style={styles.shelterCardHeader}>
                  <View style={styles.shelterCardInfo}>
                    {index === 0 && (
                      <View style={styles.closestBadge}>
                        <Text style={styles.closestBadgeText}>CLOSEST</Text>
                      </View>
                    )}
                    <Text style={styles.shelterCardName}>{shelter.name}</Text>
                    <Text style={styles.shelterCardAddress}>
                      {shelter.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.shelterCardStats}>
                  <View style={styles.shelterCardStat}>
                    <Text style={styles.shelterCardStatLabel}>Distance</Text>
                    <Text style={styles.shelterCardStatValue}>
                      {shelter.distance}
                    </Text>
                  </View>
                  <View style={styles.shelterCardStat}>
                    <Text style={styles.shelterCardStatLabel}>Time</Text>
                    <Text style={styles.shelterCardStatValue}>
                      {shelter.time}
                    </Text>
                  </View>
                  <View style={styles.shelterCardStat}>
                    <Text style={styles.shelterCardStatLabel}>Capacity</Text>
                    <Text style={styles.shelterCardStatValue}>
                      {shelter.occupants}
                    </Text>
                  </View>
                </View>

                <View style={styles.shelterCardButtons}>
                  <TouchableOpacity
                    style={[styles.shelterCardButton, styles.directionsButton]}
                    onPress={() => openMaps(shelter.lat, shelter.lng)}>
                    <Ionicons name="navigate" size={12} color="white" />
                    <Text style={styles.shelterCardButtonText}>Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shelterCardButton, styles.phoneButton]}
                    onPress={() => makeCall(shelter.phone)}>
                    <Ionicons name="call" size={16} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shelterCardButton, styles.infoButton]}
                    onPress={() => setSelectedShelter(shelter)}>
                    <Text style={styles.infoButtonText}>Info</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 20) + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1f2937' },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusTextContainer: { marginLeft: 8, flex: 1 },
  statusTitle: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  statusSubtitle: { color: 'white', fontSize: 10, opacity: 0.9 },
  statusPercentage: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  mapContainer: { flex: 1, position: 'relative' },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  mapPlaceholderText: { marginTop: 8, fontSize: 12, color: '#9ca3af' },
  mapPlaceholderSubtext: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  compass: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  weatherStats: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  weatherStatsTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#374151',
    marginBottom: 8,
  },
  weatherStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherStatLabel: { flexDirection: 'row', alignItems: 'center' },
  weatherStatText: { fontSize: 10, color: '#6b7280', marginLeft: 4 },
  weatherStatValue: { fontSize: 10, fontWeight: 'bold', color: '#1f2937' },
  shelterPopup: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    right: '10%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  closeButton: { position: 'absolute', top: 8, right: 8, padding: 4 },
  closeButtonText: { color: '#9ca3af', fontSize: 18 },
  shelterPopupName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
    paddingRight: 24,
  },
  shelterPopupAddress: { fontSize: 10, color: '#6b7280', marginBottom: 12 },
  shelterPopupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shelterPopupStat: { alignItems: 'center', flex: 1 },
  shelterPopupStatValue: {
    fontWeight: '600',
    fontSize: 12,
    color: '#1f2937',
    marginTop: 4,
  },
  shelterPopupStatLabel: { fontSize: 10, color: '#6b7280' },
  shelterPopupButtons: { flexDirection: 'row', gap: 8 },
  shelterPopupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  directionsButton: { backgroundColor: '#2563eb' },
  callButton: { backgroundColor: '#22c55e' },
  shelterPopupButtonText: { color: 'white', fontWeight: '600', fontSize: 12 },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  handleBar: {
    width: 48,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 8,
  },
  handleContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handleText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  collapsedView: { padding: 16 },
  nearestShelterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nearestLabel: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  nearestName: { fontWeight: 'bold', fontSize: 14, color: '#1f2937' },
  nearestStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  nearestStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nearestStatText: { fontSize: 10, color: '#6b7280' },
  goButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
  expandedView: { padding: 16 },
  expandedTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 16,
  },
  shelterCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shelterCardHeader: { marginBottom: 8 },
  shelterCardInfo: { flex: 1 },
  closestBadge: {
    backgroundColor: '#22c55e',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  closestBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  shelterCardName: { fontWeight: 'bold', fontSize: 14, color: '#1f2937' },
  shelterCardAddress: { fontSize: 10, color: '#6b7280' },
  shelterCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shelterCardStat: { flex: 1 },
  shelterCardStatLabel: { fontSize: 10, color: '#6b7280' },
  shelterCardStatValue: {
    fontWeight: '600',
    fontSize: 12,
    color: '#1f2937',
  },
  shelterCardButtons: { flexDirection: 'row', gap: 8 },
  shelterCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  phoneButton: { backgroundColor: '#e5e7eb', paddingHorizontal: 16 },
  infoButton: { backgroundColor: '#e5e7eb', paddingHorizontal: 16 },
  shelterCardButtonText: { color: 'white', fontWeight: '600', fontSize: 10 },
  infoButtonText: { color: '#374151', fontWeight: '600', fontSize: 10 },
});

export default TornadoShelterApp;
