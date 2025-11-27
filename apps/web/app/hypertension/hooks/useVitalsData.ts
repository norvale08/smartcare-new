import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getTodayAlertStatus = (vitals: any[]): {
  status: "alert" | "stable" | null;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
} => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayVitals = vitals
    .filter(v => new Date(v.createdAt) >= today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (todayVitals.length === 0) {
    return { status: null, systolic: null, diastolic: null, heartRate: null };
  }

  const latest = todayVitals[0];
  const systolic = Number(latest.systolic);
  const diastolic = Number(latest.diastolic);
  const heartRate = Number(latest.heartRate);

  const isHigh = systolic > 140 || diastolic > 90;
  const isLow = systolic < 90 || diastolic < 60;
  const heartRateAlert = heartRate < 60 || heartRate > 100;
  const status: "alert" | "stable" = (isHigh || isLow || heartRateAlert) ? "alert" : "stable";

  return { status, systolic, diastolic, heartRate };
};

const getBpLevel = (systolic: number, diastolic: number): string => {
  if (systolic < 90 || diastolic < 60) return 'Low Blood Pressure';
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic < 130 && diastolic < 80) return 'Elevated';
  if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) return 'Stage 1 Hypertension';
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2 Hypertension';
  if (systolic >= 180 || diastolic >= 120) return 'Hypertensive Crisis';
  return '';
};

export const useVitalsData = (alertRefreshToken: number) => {
  const [vitals, setVitals] = useState<any[]>([]);

  const fetchVitals = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/api/hypertensionVitals/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const allVitals = res.data.data;
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

      const recentVitals = allVitals
        .map((v: any) => ({
          systolic: Number(v.systolic),
          diastolic: Number(v.diastolic),
          heartRate: Number(v.heartRate),
          createdAt: new Date(v.timestamp || v.createdAt),
          date: new Date(v.timestamp || v.createdAt).toLocaleDateString(),
        }))
        .filter((v: any) => v.createdAt >= threeWeeksAgo)
        .sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());

      setVitals(recentVitals);
    } catch (err) {
      console.error("Failed to fetch vitals", err);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [alertRefreshToken]);

  const todayAlert = getTodayAlertStatus(vitals);
  const currentBpLevel = todayAlert.systolic !== null && todayAlert.diastolic !== null 
    ? getBpLevel(todayAlert.systolic, todayAlert.diastolic) 
    : '';

  return {
    vitals,
    todayAlert,
    currentBpLevel,
    fetchVitals
  };
};