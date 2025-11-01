import React, { useState } from 'react';
import { MapPin, Navigation, Phone, Users, Wind, Droplets, AlertTriangle, Search, Compass, ChevronUp, ChevronDown, ExternalLink, Clock } from 'lucide-react';

const TornadoShelterApp = () => {
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Weather data
  const weatherData = {
    stormProbability: 65,
    windSpeed: 45,
    pressure: 29.8,
    humidity: 78,
    lastUpdate: '2 min ago'
  };

  // Shelter data
  const shelters = [
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
      accessible: true
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
      accessible: true
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
      accessible: false
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
      accessible: true
    }
  ];

  const getThreatColor = (probability) => {
    if (probability >= 70) return 'bg-red-500';
    if (probability >= 40) return 'bg-orange-500';
    if (probability >= 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getThreatText = (probability) => {
    if (probability >= 70) return 'SEVERE';
    if (probability >= 40) return 'HIGH';
    if (probability >= 20) return 'MODERATE';
    return 'LOW';
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md h-full max-h-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-50"></div>
        
        {/* Main Content */}
        <div className="relative w-full h-full flex flex-col">
          
          {/* Top Section - Search & Status */}
          <div className="relative z-40 bg-white shadow-lg">
            {/* Search Bar */}
            <div className="p-3 pt-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter your location..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Status Bar */}
            <div className="px-3 pb-3">
              <div className={`${getThreatColor(weatherData.stormProbability)} rounded-lg p-3 flex items-center justify-between text-white`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <span className="font-bold text-sm">TORNADO THREAT: {getThreatText(weatherData.stormProbability)}</span>
                    <p className="text-xs opacity-90">Updated {weatherData.lastUpdate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{weatherData.stormProbability}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Compass - Top Left */}
          <div className="absolute top-32 left-3 z-30 bg-white rounded-full p-3 shadow-lg">
            <Compass className="w-6 h-6 text-blue-600" />
          </div>

          {/* Map Area */}
          <div className="flex-1 relative bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
            {/* Simulated Map with Oklahoma centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400 text-xs">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Google Maps / Apple Maps</p>
                <p className="font-semibold">Centered on Oklahoma</p>
              </div>
            </div>

            {/* Weather Stats Panel - Center Right */}
            <div className="absolute top-4 right-3 bg-white bg-opacity-95 rounded-xl p-3 shadow-lg w-36">
              <h3 className="font-bold text-xs text-gray-700 mb-2">Weather Stats</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <AlertTriangle className="w-3 h-3" />
                    Storm
                  </span>
                  <span className="font-bold text-orange-600">{weatherData.stormProbability}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Wind className="w-3 h-3" />
                    Wind
                  </span>
                  <span className="font-bold">{weatherData.windSpeed} mph</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Droplets className="w-3 h-3" />
                    Humid
                  </span>
                  <span className="font-bold">{weatherData.humidity}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Pressure</span>
                  <span className="font-bold">{weatherData.pressure}"</span>
                </div>
              </div>
            </div>

            {/* Shelter Markers on Map */}
            <div className="absolute top-1/4 left-1/4">
              <button
                onClick={() => setSelectedShelter(shelters[0])}
                className="relative group"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {shelters[0].name}
                </div>
              </button>
            </div>

            <div className="absolute top-1/2 right-1/4">
              <button
                onClick={() => setSelectedShelter(shelters[1])}
                className="relative group"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {shelters[1].name}
                </div>
              </button>
            </div>

            <div className="absolute bottom-1/3 left-1/3">
              <button
                onClick={() => setSelectedShelter(shelters[2])}
                className="relative group"
              >
                <div className="w-10 h-10 bg-yellow-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {shelters[2].name}
                </div>
              </button>
            </div>

            {/* User Location - Center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full animate-ping absolute"></div>
                <div className="w-14 h-14 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center relative z-10">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Shelter Info Popup */}
            {selectedShelter && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-4 w-72 z-20 border-2 border-gray-200">
                <button
                  onClick={() => setSelectedShelter(null)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                
                <h3 className="font-bold text-gray-800 mb-1 pr-6">{selectedShelter.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{selectedShelter.address}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="text-center">
                    <Navigation className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <p className="font-semibold">{selectedShelter.distance}</p>
                    <p className="text-gray-500">{selectedShelter.time}</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-4 h-4 mx-auto mb-1 text-green-600" />
                    <p className="font-semibold">{selectedShelter.occupants}</p>
                    <p className="text-gray-500">Capacity</p>
                  </div>
                  <div className="text-center">
                    <Phone className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                    <p className="font-semibold text-xs">{selectedShelter.phone.slice(0, 9)}</p>
                    <p className="text-gray-500">{selectedShelter.phone.slice(9)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://maps.google.com/?daddr=${selectedShelter.lat},${selectedShelter.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 hover:bg-blue-700"
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </a>
                  <a
                    href={`tel:${selectedShelter.phone}`}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 hover:bg-green-700"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Sheet - Nearest Shelters */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 z-30 ${
              bottomSheetExpanded ? 'h-3/4' : 'h-32'
            }`}
          >
            {/* Pull Tab */}
            <button
              onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
              className="w-full py-3 flex flex-col items-center border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-2"></div>
              <div className="flex items-center gap-2">
                {bottomSheetExpanded ? (
                  <>
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Hide Shelters</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">View All Shelters ({shelters.length})</span>
                  </>
                )}
              </div>
            </button>

            {/* Collapsed View - Nearest Shelter Only */}
            {!bottomSheetExpanded && (
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">NEAREST SHELTER</p>
                    <h3 className="font-bold text-gray-800">{shelters[0].name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {shelters[0].distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {shelters[0].time}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?daddr=${shelters[0].lat},${shelters[0].lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Go
                  </a>
                </div>
              </div>
            )}

            {/* Expanded View - All Shelters List */}
            {bottomSheetExpanded && (
              <div className="p-4 overflow-y-auto h-full pb-24">
                <h2 className="font-bold text-lg text-gray-800 mb-4">Nearby Shelters</h2>
                
                {shelters.map((shelter, index) => (
                  <div key={shelter.id} className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                              CLOSEST
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">{shelter.name}</h3>
                        <p className="text-xs text-gray-500">{shelter.address}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div>
                        <p className="text-gray-500">Distance</p>
                        <p className="font-semibold text-gray-800">{shelter.distance}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Time</p>
                        <p className="font-semibold text-gray-800">{shelter.time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Capacity</p>
                        <p className="font-semibold text-gray-800">{shelter.occupants}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`https://maps.google.com/?daddr=${shelter.lat},${shelter.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-blue-700"
                      >
                        <Navigation className="w-3 h-3" />
                        Directions
                      </a>
                      <a
                        href={`tel:${shelter.phone}`}
                        className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-center hover:bg-gray-300"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setSelectedShelter(shelter)}
                        className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300"
                      >
                        Info
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TornadoShelterApp;