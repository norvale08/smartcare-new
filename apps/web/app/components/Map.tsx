'use client';

import { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  updatedAt?: string;
}

interface Facility {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  type: string;
  rating?: number;
  isOpen?: boolean;
  phoneNumber?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function NearbyFacilitiesFinder() {
  const [location, setLocation] = useState<Location | null>(null);
  const [searchLocation, setSearchLocation] = useState<Location | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingFacilities, setSearchingFacilities] = useState(false);
  const [error, setError] = useState('');
  const [facilityType, setFacilityType] = useState('hospital');
  const [searchRadius, setSearchRadius] = useState(5000); // 5km default
  const [savingLocation, setSavingLocation] = useState(false);
  const [success, setSuccess] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const defaultCenter = { lat: -1.286389, lng: 36.817223 }; // Nairobi, Kenya

  useEffect(() => {
    fetchSavedLocation();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapsLoaded(true);
    }
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSavedLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await fetch(`${API_URL}/api/profile/location`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.location) {
          setLocation(data.data.location);
          setSearchLocation(data.data.location); 
        }
      } else if (response.status === 404) {
        console.log('No location saved yet');
      }
    } catch (err) {
      console.error('Error fetching location:', err);
    }
  };

  // Search for places using Google Places Autocomplete
  const searchPlaces = async (query: string) => {
    if (!query.trim() || !mapsLoaded) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Use Google Places Autocomplete
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'ke' }, // Kenya specific, remove for global
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchResults(predictions);
            setShowSearchResults(true);
          }
          setIsSearching(false);
        }
      );
    } catch (err) {
      console.error('Search error:', err);
      setIsSearching(false);
    }
  };

  // Get details for a selected place
  const getPlaceDetails = async (placeId: string) => {
    try {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.getDetails(
        {
          placeId,
          fields: ['geometry', 'name', 'formatted_address', 'place_id'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const newLocation = {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
              address: place.formatted_address || place.name || 'Location',
            };

            setSearchLocation(newLocation);
            setSearchQuery(place.formatted_address || place.name || '');
            setShowSearchResults(false);
            setFacilities([]); // Clear previous results
          }
        }
      );
    } catch (err) {
      console.error('Error getting place details:', err);
    }
  };

  // Reverse geocode coordinates to address
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
        throw new Error('Google Maps not loaded');
      }
      
      const geocoder = new google.maps.Geocoder();
      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject('Address not found');
          }
        });
      });
    } catch (err) {
      console.error('Geocoding error:', err);
      return 'Address not available';
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          let address = 'Current Location';
          try {
            address = await getAddressFromCoords(coords.lat, coords.lng);
          } catch (geocodeError) {
            console.warn('Could not get address:', geocodeError);
          }
          
          const newLocation = { ...coords, address };
          setLocation(newLocation);
          setSearchLocation(newLocation);
          setSearchQuery(address);
          
          // Save to database
          await saveLocationToDatabase(coords.lat, coords.lng, address);
        } catch (err) {
          console.error('Error processing location:', err);
          setError('Failed to process location. Please try again.');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please check permissions.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const saveLocationToDatabase = async (lat: number, lng: number, address?: string) => {
    setSavingLocation(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to save location');
        setSavingLocation(false);
        return;
      }

      const payload = {
        lat,
        lng,
        address: address || 'Location saved'
      };

      const response = await fetch(`${API_URL}/api/profile/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Location saved to your profile!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save location');
      }
    } catch (err) {
      console.error('Failed to save location:', err);
      setError('Network error. Please try again.');
    } finally {
      setSavingLocation(false);
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const searchNearbyFacilities = async () => {
    const targetLocation = searchLocation || location;
    
    if (!targetLocation) {
      setError('Please set a location first (use your current location or search for a place)');
      return;
    }

    if (!mapsLoaded || !window.google || !window.google.maps.places) {
      setError('Maps service is still loading. Please try again in a moment.');
      return;
    }

    setSearchingFacilities(true);
    setError('');
    setFacilities([]);

    try {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      const request = {
        location: new google.maps.LatLng(targetLocation.lat, targetLocation.lng),
        radius: searchRadius,
        type: facilityType,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const facilitiesData: Facility[] = results.map((place) => ({
            id: place.place_id || Date.now().toString(),
            name: place.name || 'Unknown',
            address: place.vicinity || 'Address not available',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            distance: calculateDistance(
              targetLocation.lat,
              targetLocation.lng,
              place.geometry?.location?.lat() || 0,
              place.geometry?.location?.lng() || 0
            ),
            type: facilityType,
            rating: place.rating,
            isOpen: place.opening_hours?.isOpen(),
          }));

          facilitiesData.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          setFacilities(facilitiesData);
        } else {
          setError('No facilities found nearby. Try increasing the search radius or changing the location.');
        }
        setSearchingFacilities(false);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to search facilities');
      setSearchingFacilities(false);
    }
  };

  const getDirections = (facility: Facility) => {
    const targetLocation = searchLocation || location;
    if (!targetLocation) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${targetLocation.lat},${targetLocation.lng}&destination=${facility.lat},${facility.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const facilityTypes = [
    { value: 'hospital', label: ' Hospitals & Medical Centers', icon: '🏥' },
    { value: 'pharmacy', label: '💊 Pharmacies & Chemists', icon: '💊' },
    { value: 'doctor', label: '👨‍⚕️ General Practitioners', icon: '👨‍⚕️' },
    { value: 'physiotherapist', label: '🏃 Physiotherapy Centers', icon: '🏃' },
    { value: 'health', label: '🩺 Health Clinics', icon: '🩺' },
    { value: 'dentist', label: '🦷 Dentists', icon: '🦷' },
    { value: 'veterinary_care', label: '🐾 Veterinary Clinics', icon: '🐾' },
  ];

  return (
    <APIProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={['places']}
    >
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls & Results */}
          <div className="lg:col-span-1 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Find Medical Facilities
              </h1>
              <p className="text-gray-600 text-sm">
                Search for any location or use your current location to find nearby medical facilities
              </p>
            </div>

            {/* Success Alert */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="text-sm flex items-center gap-2">
                  <span>✓</span> {success}
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Location Search Box */}
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">📍 Set Location</h3>
                
                {/* Search Box */}
                <div className="relative" ref={searchRef}>
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchPlaces(e.target.value);
                      }}
                      onFocus={() => searchQuery && setShowSearchResults(true)}
                      placeholder="Search for a place or address..."
                      className="w-full outline-none text-sm"
                    />
                    {isSearching && (
                      <svg className="animate-spin h-4 w-4 text-blue-600 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((prediction) => (
                        <div
                          key={prediction.place_id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => getPlaceDetails(prediction.place_id)}
                        >
                          <div className="flex items-start">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{prediction.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* OR Divider */}
                <div className="flex items-center my-2">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="mx-3 text-xs text-gray-500">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Current Location Button */}
                <button
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      Use My Current Location
                    </>
                  )}
                </button>

                {/* Location Status */}
                {(searchLocation || location) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Location Set</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {searchLocation?.address || location?.address || 'Location'}
                        </p>
                        {(searchLocation || location) && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {(searchLocation?.lat || location?.lat)?.toFixed(6)}, {(searchLocation?.lng || location?.lng)?.toFixed(6)}
                          </p>
                        )}
                      </div>
                      {savingLocation && (
                        <div className="ml-auto text-xs text-blue-600">Saving...</div>
                      )}
                    </div>
                    {(searchLocation || location) && searchLocation?.lat !== location?.lat && (
                      <div className="mt-2 text-xs text-amber-600">
                        ⚠️ Using searched location (not saved to profile)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Search Controls */}
              {(searchLocation || location) && (
                <>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-4">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Tip:</strong> Find pharmacies for your diabetes/hypertension medications, or hospitals for specialist care.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facility Type
                    </label>
                    <select
                      value={facilityType}
                      onChange={(e) => setFacilityType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      {facilityTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Radius: {searchRadius / 1000}km
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="20000"
                      step="1000"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1km</span>
                      <span>10km</span>
                      <span>20km</span>
                    </div>
                  </div>

                  <button
                    onClick={searchNearbyFacilities}
                    disabled={searchingFacilities || !mapsLoaded}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-medium flex items-center justify-center gap-2"
                  >
                    {searchingFacilities ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        Search Facilities
                      </>
                    )}
                    {!mapsLoaded && ' (Loading maps...)'}
                  </button>

                  {/* Save Location Button (only for current location, not searched) */}
                  {location && !savingLocation && searchLocation?.lat === location?.lat && (
                    <button
                      onClick={() => saveLocationToDatabase(location.lat, location.lng, location.address)}
                      className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                      </svg>
                      Save This Location to Profile
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Results List */}
            {facilities.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Found {facilities.length} facilities
                  </h3>
                  <span className="text-xs text-gray-500">
                    Sorted by distance
                  </span>
                </div>
                <div className="space-y-3">
                  {facilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      onClick={() => setSelectedFacility(facility)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {facility.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          {facility.rating && (
                            <span className="text-yellow-500 text-xs flex items-center">
                              ⭐ {facility.rating}
                            </span>
                          )}
                          {facility.isOpen !== undefined && (
                            <span className={`text-xs ${facility.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                              {facility.isOpen ? '✓' : '✗'}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{facility.address}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600 font-medium">
                          📍 {facility.distance?.toFixed(2)} km away
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            getDirections(facility);
                          }}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Directions
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {facility.isOpen !== undefined && (
                          <span className={`text-xs ${facility.isOpen ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded' : 'text-red-600 bg-red-50 px-2 py-0.5 rounded'}`}>
                            {facility.isOpen ? 'Open now' : 'Closed'}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">
                          {facility.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] relative">
              {/* Map Controls */}
              <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-2">
                <div className="text-xs text-gray-600">
                  {searchLocation || location ? (
                    <>
                      <span className="font-medium">Searching around:</span><br/>
                      <span className="text-gray-500">{searchLocation?.address || location?.address}</span>
                    </>
                  ) : (
                    'Search for a location to begin'
                  )}
                </div>
              </div>

              <Map
                defaultCenter={searchLocation || location || defaultCenter}
                center={searchLocation || location || defaultCenter}
                defaultZoom={13}
                zoom={searchLocation || location ? 13 : 12}
                gestureHandling="greedy"
              >
                {/* Current/Saved Location Marker */}
                {location && (
                  <Marker
                    position={{ lat: location.lat, lng: location.lng }}
                    title="Your Saved Location"
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor: "#4285F4",
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: "#FFFFFF",
                      scale: 10
                    }}
                  />
                )}

                {/* Searched Location Marker */}
                {searchLocation && searchLocation.lat !== location?.lat && (
                  <Marker
                    position={{ lat: searchLocation.lat, lng: searchLocation.lng }}
                    title="Searched Location"
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor: "#EA4335",
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: "#FFFFFF",
                      scale: 10
                    }}
                  />
                )}

                {/* Facility Markers */}
                {facilities.map((facility) => (
                  <Marker
                    key={facility.id}
                    position={{ lat: facility.lat, lng: facility.lng }}
                    title={facility.name}
                    onClick={() => setSelectedFacility(facility)}
                  />
                ))}

                {/* Info Window for Selected Facility */}
                {selectedFacility && (
                  <InfoWindow
                    position={{ lat: selectedFacility.lat, lng: selectedFacility.lng }}
                    onCloseClick={() => setSelectedFacility(null)}
                  >
                    <div className="p-2 max-w-xs">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {selectedFacility.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedFacility.address}
                      </p>
                      <div className="flex items-center gap-4 mb-2">
                        {selectedFacility.rating && (
                          <p className="text-sm text-yellow-600">
                            ⭐ {selectedFacility.rating}/5
                          </p>
                        )}
                        {selectedFacility.isOpen !== undefined && (
                          <span className={`text-xs ${selectedFacility.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedFacility.isOpen ? 'Open now' : 'Closed'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-600 font-medium mb-3">
                        📍 {selectedFacility.distance?.toFixed(2)} km away
                      </p>
                      <button
                        onClick={() => getDirections(selectedFacility)}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        Get Directions
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
}