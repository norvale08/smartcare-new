import { useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useDietData = (language: string) => {
  const [dietData, setDietData] = useState<any>(null);
  const [dietLoading, setDietLoading] = useState(false);
  const [regeneratingDiet, setRegeneratingDiet] = useState(false);

  const fetchDietRecommendations = async () => {
    try {
      setRegeneratingDiet(true);
      setDietLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found - cannot fetch diet recommendations");
        return;
      }
      
      const languageParam = language === "sw-TZ" ? "sw-TZ" : "en-US";
      const res = await axios.get(`${API_URL}/api/hypertension/diet?language=${languageParam}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const data = res.data?.data || res.data;

      if (data && data.breakfast) {
        setDietData(data);
      } else {
        console.warn("Diet API returned unexpected data:", data);
      }
    } catch (err: any) {
      console.error("Failed to fetch diet recommendations:", err?.response?.data || err);
      if (err?.response?.status === 401) {
        console.warn("User not authenticated — token invalid or missing");
      } else if (err?.response?.status === 500) {
        console.error("Server error fetching diet recommendations");
      }
    } finally {
      setDietLoading(false);
      setRegeneratingDiet(false);
    }
  };

  return {
    dietData,
    dietLoading,
    regeneratingDiet,
    fetchDietRecommendations
  };
};