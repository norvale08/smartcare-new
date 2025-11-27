import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const usePatientData = () => {
  const [patient, setPatient] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const getUserFromToken = (t: string) => {
    try {
      const parts = t.split(".");
      if (parts.length < 2) return {} as any;
      const base64Url = parts[1] ?? "";
      if (!base64Url) return {} as any;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, "=");
      const json = atob(padded);
      const payload = JSON.parse(json);
      return {
        fullName: payload?.name || "",
        firstname: payload?.firstname || "",
        lastname: payload?.lastname || "",
      };
    } catch {
      return {} as any;
    }
  };

  const fetchPatient = async () => {
    const tokenStr = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenStr) return;

    try {
      const res = await axios.get(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${tokenStr}` },
        withCredentials: true,
      });
      const data = res.data?.data || res.data;
      setPatient(data);
      setEditForm({
        fullName: data?.fullName || "",
        dob: data?.dob ? new Date(data.dob).toISOString().slice(0, 10) : "",
        gender: data?.gender || "",
        weight: data?.weight ?? "",
        height: data?.height ?? "",
        phoneNumber: data?.phoneNumber || "",
      });
    } catch (err: any) {
      const basic = getUserFromToken(tokenStr);
      const fallback: any = {
        fullName: basic.fullName || `${basic.firstname || ""} ${basic.lastname || ""}`.trim(),
        weight: undefined,
        height: undefined,
        dob: undefined,
      };
      setPatient(fallback);
      setEditForm({
        fullName: fallback.fullName || "",
        dob: "",
        gender: "",
        weight: "",
        height: "",
        phoneNumber: "",
      });
      console.error("Failed to fetch patient info", err);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    
    try {
      const payload: any = {
        fullName: editForm.fullName,
        dob: editForm.dob,
        gender: editForm.gender,
        weight: editForm.weight ? Number(editForm.weight) : undefined,
        height: editForm.height ? Number(editForm.height) : undefined,
        phoneNumber: editForm.phoneNumber,
      };
      
      await axios.put(`${API_URL}/api/profile`, payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      const res = await axios.get(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      const data = res.data?.data || res.data;
      setPatient(data);
    } catch (error) {
      console.error("Failed to update patient profile", error);
    }
  };

  return {
    patient,
    editForm,
    setPatient,
    setEditForm,
    handleEditChange,
    handleSaveProfile,
    fetchPatient
  };
};