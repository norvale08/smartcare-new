"use client";

import React, { useEffect, useState, FC } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { Star } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const apiKey = process.env.NEXT_PUBLIC_ORS_KEY!;

// Component to recenter the map on user location change
const RecenterMap: FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

interface ProviderMapProps {
  destination: { lat: number; lng: number } | null;
  
}

const ProviderMap: FC<ProviderMapProps> = ({ destination }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  // Fetch route when both user location and destination are available
  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !destination) return;

      try {
        const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: apiKey,
          },
          body: JSON.stringify({
            coordinates: [
              [userLocation.lng, userLocation.lat],
              [destination.lng, destination.lat],
            ],
          }),
        });

        const data = await response.json();
        const geometry = data.features[0].geometry.coordinates;
        const latLngs = geometry.map(([lng, lat]: number[]) => [lat, lng]) as [number, number][];
        setRoute(latLngs);
      } catch (error) {
        console.error("Error fetching directions:", error);
      }
    };

    fetchRoute();
  }, [userLocation, destination]);

  return (
    <div className="h-72 w-full rounded-lg overflow-hidden">
      <MapContainer center={[-1.2921, 36.8219]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
            <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
          </>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {route.length > 0 && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </div>
  );
};

// Hardcoded list of nearby clinics
const clinics = [
  {
    name: "Dr. Michael Chen",
    specialty: "Cardiologist",
    distance: "2.3 miles",
    lat: -1.2951,
    lng: 36.8225,
  },
  {
    name: "St. Mary's Medical Center",
    specialty: "Emergency Care",
    distance: "1.8 miles",
    lat: -1.2921,
    lng: 36.8219,
  },
];

const Provider: FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<{ lat: number; lng: number } | null>(null);

  const filteredClinics = clinics.filter((clinic) =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for doctors or specialties..."
          className="w-full border-2 border-gray-300 rounded-lg pl-4 pr-4 py-2 focus:border-emerald-400 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Map */}
      <ProviderMap destination={selectedDestination} />

      {/* Clinic List */}
      <div className="space-y-3">
        {filteredClinics.map((clinic, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-800">{clinic.name}</h4>
                <p className="text-sm text-gray-600">
                  {clinic.specialty} • {clinic.distance} away
                </p>
              </div>
              <button
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-1 text-sm font-medium transition-colors"
                onClick={() => setSelectedDestination({ lat: clinic.lat, lng: clinic.lng })}
              >
                Directions
              </button>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">4.5 (96 reviews)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Provider;
