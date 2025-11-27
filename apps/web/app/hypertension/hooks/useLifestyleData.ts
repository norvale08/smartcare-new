import { useState, Dispatch, SetStateAction } from "react";
import axios from "axios";
import type { LifestyleData } from "../components/LifestyleAssessment";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useLifestyleData = (language: string, alertRefreshToken: number) => {
  const [lifestyle, setLifestyle] = useState<LifestyleData>({
    alcohol: false,
    smoking: false,
    caffeine: 0,
    exercise: ""
  });
  
  const [aiRecommendations, setAiRecommendations] = useState({
    advice: '',
    alerts: [],
    warnings: []
  });
  
  const [loadingAI, setLoadingAI] = useState(false);
  const [regeneratingLifestyle, setRegeneratingLifestyle] = useState(false);

  const fetchAIRecommendations = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    try {
      setLoadingAI(true);
      const languageParam = language === "sw-TZ" ? "sw-TZ" : "en-US";
      const res = await axios.get(`${API_URL}/api/hypertension/lifestyle?language=${languageParam}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAiRecommendations(res.data);
    } catch (err) {
      console.error("Failed to fetch AI recommendations:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRegenerateLifestyle = async () => {
    setRegeneratingLifestyle(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found - cannot regenerate lifestyle");
      setRegeneratingLifestyle(false);
      return;
    }
    
    try {
      const lifestylePayload = {
        smoking: lifestyle.smoking ? "Heavy" : "None",
        alcohol: lifestyle.alcohol ? "Frequently" : "None",
        exercise: lifestyle.exercise === "high" ? "Daily" : 
                 lifestyle.exercise === "moderate" ? "Few times/week" : 
                 lifestyle.exercise === "low" ? "Rarely" : "None",
        sleep: "7-8 hrs"
      };

      await axios.post(`${API_URL}/api/hypertension/lifestyle/update`, lifestylePayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      const aiRes = await axios.get(`${API_URL}/api/hypertension/lifestyle`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      setAiRecommendations(aiRes.data);
    } catch (error) {
      console.error("Failed to regenerate lifestyle recommendations:", error);
    } finally {
      setRegeneratingLifestyle(false);
    }
  };

  return {
    lifestyle,
    setLifestyle,
    aiRecommendations,
    setAiRecommendations,
    loadingAI,
    regeneratingLifestyle,
    fetchAIRecommendations,
    handleRegenerateLifestyle
  };
};