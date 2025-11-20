//useLocationTracker.ts
"use client";
import { useEffect } from "react";

const useLocationTracker = () => {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/location/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lat: latitude,
            lng: longitude,
            address: "Current Location",
          }),
        });
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Location updated successfully:", data);
        } else {
          const error = await response.json();
          console.error("❌ Failed to update location:", error);
        }
      } catch (err) {
        console.error("❌ Network error updating location:", err);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn("⚠️ Geolocation error:", err.message);
      if (err.code === err.PERMISSION_DENIED) {
        console.log("📍 Location permission denied by user");
      }
    };

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser");
      return;
    }

    // Request immediate position, then watch changes
    navigator.geolocation.getCurrentPosition(updateLocation, handleError);

    const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      maximumAge: 30000, // Accept cached position up to 30 seconds old
      timeout: 20000,
    });

    // Cleanup when component unmounts
    return () => {
      console.log("🛑 Stopping location tracking");
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);
};

export default useLocationTracker;
