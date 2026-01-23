'use client';

import { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Star,
  Phone,
  Clock,
  Hospital,
  Pill,
  Stethoscope,
  Activity,
  Heart,
  PawPrint,
  Save,
  Navigation2,
  Info,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

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
  const [searchRadius, setSearchRadius] = useState(5000);
  const [savingLocation, setSavingLocation] = useState(false);
  const [success, setSuccess] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  const defaultCenter = { lat: -1.286389, lng: 36.817223 };

  useEffect(() => {
    fetchSavedLocation();
  }, []);

  useEffect(() => {
    const checkMapsLoaded = () => {
      if (window.google?.maps?.places) {
        setMapsLoaded(true);
      } else {
        setTimeout(checkMapsLoaded, 100);
      }
    };
    checkMapsLoaded();
  }, []);

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
      }
    } catch (err) {
      console.error('Error fetching location:', err);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim() || !mapsLoaded || !window.google?.maps?.places) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'ke' },
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
            setFacilities([]);
          }
        }
      );
    } catch (err) {
      console.error('Error getting place details:', err);
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      if (!window.google?.maps?.Geocoder) {
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
    const R = 6371;
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

    if (!mapsLoaded || !window.google?.maps?.places) {
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
    { value: 'hospital', label: 'Hospitals & Medical Centers', icon: Hospital },
    { value: 'pharmacy', label: 'Pharmacies & Chemists', icon: Pill },
    { value: 'doctor', label: 'General Practitioners', icon: Stethoscope },
    { value: 'physiotherapist', label: 'Physiotherapy Centers', icon: Activity },
    { value: 'health', label: 'Health Clinics', icon: Heart },
    { value: 'dentist', label: 'Dentists', icon: Stethoscope },
    { value: 'veterinary_care', label: 'Veterinary Clinics', icon: PawPrint },
  ];

  const getFacilityIcon = () => {
    const type = facilityTypes.find(t => t.value === facilityType);
    return type ? type.icon : Hospital;
  };

  const FacilityIcon = getFacilityIcon();

  return (
    <APIProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={['places']}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium hidden sm:inline">Back to Dashboard</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Hospital className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Medical Facilities
                </h1>
              </div>
              <div className="w-20 sm:w-32"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Panel - Controls & Results */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-4">
              {/* Mobile Toggle Button */}
              <button
                onClick={() => setShowControls(!showControls)}
                className="lg:hidden w-full bg-white rounded-lg shadow-md p-3 flex items-center justify-between text-gray-900 font-medium"
              >
                <span>Search Controls</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${showControls ? 'rotate-180' : ''}`} />
              </button>

              <div className={`space-y-4 ${showControls ? 'block' : 'hidden lg:block'}`}>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-gray-600 text-sm">
                  Search for any location or use your current location to find nearby medical facilities
                </p>
              </div>

              {/* Success Alert */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{success}</p>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Location Search Box */}
              <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-700" />
                    <h3 className="font-medium text-gray-900 text-sm">Set Location</h3>
                  </div>
                  
                  {/* Search Box */}
                  <div className="relative" ref={searchRef}>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <Search className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
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
                        <Loader2 className="w-4 h-4 text-blue-600 ml-2 animate-spin flex-shrink-0" />
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
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm font-medium text-gray-900">{prediction.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center my-3">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-3 text-xs text-gray-500 font-medium">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>

                  {/* Current Location Button */}
                  <button
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        <span>Use My Current Location</span>
                      </>
                    )}
                  </button>

                  {/* Location Status */}
                  {(searchLocation || location) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-900">Location Set</p>
                          <p className="text-xs text-gray-600 mt-0.5 break-words">
                            {searchLocation?.address || location?.address || 'Location'}
                          </p>
                          {(searchLocation || location) && (
                            <p className="text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {(searchLocation?.lat || location?.lat)?.toFixed(6)}, {(searchLocation?.lng || location?.lng)?.toFixed(6)}
                            </p>
                          )}
                        </div>
                        {savingLocation && (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                        )}
                      </div>
                      {(searchLocation || location) && searchLocation?.lat !== location?.lat && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Using searched location (not saved to profile)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search Controls */}
                {(searchLocation || location) && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-2">
                      <div className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-blue-800 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                          <strong>Tip:</strong> Find pharmacies for medications or hospitals for specialist care.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facility Type
                      </label>
                      <div className="relative">
                        <select
                          value={facilityType}
                          onChange={(e) => setFacilityType(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        >
                          {facilityTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <FacilityIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      {searchingFacilities ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Search Facilities</span>
                        </>
                      )}
                    </button>

                    {/* Save Location Button */}
                    {location && !savingLocation && searchLocation?.lat === location?.lat && (
                      <button
                        onClick={() => saveLocationToDatabase(location.lat, location.lng, location.address)}
                        className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save Location to Profile
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Results List */}
              {facilities.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-3 max-h-[400px] lg:max-h-[500px] overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Found {facilities.length} facilities
                    </h3>
                    <span className="text-xs text-gray-500">
                      By distance
                    </span>
                  </div>
                  <div className="space-y-2">
                    {facilities.map((facility) => (
                      <div
                        key={facility.id}
                        className="border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                        onClick={() => setSelectedFacility(facility)}
                      >
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="font-medium text-gray-900 text-sm flex-1">
                            {facility.name}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {facility.rating && (
                              <span className="text-xs flex items-center gap-0.5 text-yellow-600">
                                <Star className="w-3 h-3 fill-yellow-500" />
                                {facility.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{facility.address}</p>
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {facility.distance?.toFixed(2)} km away
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              getDirections(facility);
                            }}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                          >
                            <Navigation2 className="w-3 h-3" />
                            Directions
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {facility.isOpen !== undefined && (
                            <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded ${facility.isOpen ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                              <Clock className="w-3 h-3" />
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
            </div>

            {/* Right Panel - Map */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-[500px] sm:h-[600px] lg:h-[calc(100vh-140px)] relative">
                {/* Map Controls */}
                <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-2 max-w-[calc(100%-2rem)]">
                  <div className="text-xs text-gray-600">
                    {searchLocation || location ? (
                      <>
                        <span className="font-medium">Searching around:</span><br/>
                        <span className="text-gray-500 break-words">{searchLocation?.address || location?.address}</span>
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
                  mapId="medical-facilities-map"
                >
                  {location && window.google?.maps && (
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

                  {searchLocation && searchLocation.lat !== location?.lat && window.google?.maps && (
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

                  {facilities.map((facility) => (
                    <Marker
                      key={facility.id}
                      position={{ lat: facility.lat, lng: facility.lng }}
                      title={facility.name}
                      onClick={() => setSelectedFacility(facility)}
                    />
                  ))}

                  {selectedFacility && (
                    <InfoWindow
                      position={{ lat: selectedFacility.lat, lng: selectedFacility.lng }}
                      onCloseClick={() => setSelectedFacility(null)}
                    >
                      <div className="p-2 max-w-xs">
                        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                          <Hospital className="w-4 h-4 text-blue-600" />
                          {selectedFacility.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {selectedFacility.address}
                        </p>
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          {selectedFacility.rating && (
                            <p className="text-sm text-yellow-600 flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-500" />
                              {selectedFacility.rating}/5
                            </p>
                          )}
                          {selectedFacility.isOpen !== undefined && (
                            <span className={`text-xs flex items-center gap-1 ${selectedFacility.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                              <Clock className="w-3 h-3" />
                              {selectedFacility.isOpen ? 'Open now' : 'Closed'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-600 font-medium mb-3 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedFacility.distance?.toFixed(2)} km away
                        </p>
                        <button
                          onClick={() => getDirections(selectedFacility)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <Navigation2 className="w-4 h-4" />
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
      </div>
    </APIProvider>
  );
}