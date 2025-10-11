//PatientLocation.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { Patient } from "@/types/doctor";
import { getRiskColor } from "../lib/utils";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});


interface PatientLocationsProps {
  patients: Patient[];
}

const PatientLocations: React.FC<PatientLocationsProps> = ({ patients }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Function to get marker color based on risk level
  const getMarkerColor = (riskLevel: "low" | "high" | "critical") => {
    switch (riskLevel) {
      case "critical":
        return "#dc2626"; // red
      case "high":
        return "#f59e0b"; // amber
      case "low":
        return "#10b981"; // green
      default:
        return "#6b7280"; // gray
    }
  };

  // Create custom icon with risk-based color
  const createCustomIcon = (riskLevel: "low" | "high" | "critical") => {
    const color = getMarkerColor(riskLevel);
    const svgIcon = `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.125 12.5 28.125S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12.5" cy="12.5" r="5" fill="white"/>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: "custom-marker-icon",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [-1.286389, 36.817223], // Default to Nairobi, Kenya
      zoom: 12,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filter patients with valid coordinates
    const patientsWithCoords = patients.filter(
      (patient) =>
        patient.coordinates &&
        typeof patient.coordinates.lat === "number" &&
        typeof patient.coordinates.lng === "number"
    );

    if (patientsWithCoords.length === 0) {
      console.log("No patients with valid coordinates");
      return;
    }

    // Add markers for each patient
    const bounds = L.latLngBounds([]);

    patientsWithCoords.forEach((patient) => {
      if (!patient.coordinates) return;

      const { lat, lng } = patient.coordinates;
      const latLng = L.latLng(lat, lng);
      bounds.extend(latLng);

      const marker = L.marker(latLng, {
        icon: createCustomIcon(patient.riskLevel),
      });

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">
            ${patient.name}
          </div>
          ${patient.condition ? `
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
              Condition: ${patient.condition}
            </div>
          ` : ''}
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            Location: ${patient.location || "Unknown"}
          </div>
          ${patient.vitals ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 12px;">
              <div style="font-weight: 500; margin-bottom: 4px;">Vitals:</div>
              ${patient.vitals.heartRate ? `<div>Heart Rate: ${patient.vitals.heartRate} bpm</div>` : ''}
              ${patient.vitals.bloodPressure ? `<div>BP: ${patient.vitals.bloodPressure}</div>` : ''}
              ${patient.vitals.glucose ? `<div>Glucose: ${patient.vitals.glucose} mg/dL</div>` : ''}
              ${patient.vitals.bmi ? `<div>BMI: ${patient.vitals.bmi}</div>` : ''}
            </div>
          ` : ''}
          <div style="margin-top: 8px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; 
                         background-color: ${patient.riskLevel === 'critical' ? '#fee2e2' : patient.riskLevel === 'high' ? '#fef3c7' : '#d1fae5'};
                         color: ${patient.riskLevel === 'critical' ? '#991b1b' : patient.riskLevel === 'high' ? '#92400e' : '#065f46'};">
              ${patient.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [patients]);
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Patient Locations</h2>
        <p className="text-xs text-gray-500 mt-1">
          {patients.filter(p => p.coordinates).length} of {patients.length} patients with location data
        </p>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="h-64 bg-gray-100 rounded-lg relative"
        style={{ minHeight: "250px" }}
      >
        {patients.filter(p => p.coordinates).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-gray-50">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No patient location data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Patient List */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">All Patients</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-gray-600">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span className="text-gray-600">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-600">Critical</span>
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
          {patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No patients assigned
            </div>
          ) : (
            patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  if (patient.coordinates && mapRef.current) {
                    mapRef.current.setView(
                      [patient.coordinates.lat, patient.coordinates.lng],
                      15,
                      { animate: true }
                    );
                    // Find and open the marker popup
                    markersRef.current.forEach((marker) => {
                      const markerLatLng = marker.getLatLng();
                      if (
                        markerLatLng.lat === patient.coordinates!.lat &&
                        markerLatLng.lng === patient.coordinates!.lng
                      ) {
                        marker.openPopup();
                      }
                    });
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <MapPin
                    className={`w-4 h-4 ${patient.coordinates ? 'text-blue-500' : 'text-gray-300'
                      }`}
                  />
                  <div>
                    <div className="text-sm font-medium">{patient.name}</div>
                    <div className="text-xs text-gray-500">
                      {patient.location || "No location data"}
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(patient.riskLevel)}`}
                >
                  {patient.riskLevel}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientLocations;