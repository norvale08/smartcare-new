import React from 'react'
import MedicationReminders from '@/app/hypertension/components/MedicationReminders'
import PatientAppointments from '@/app/components/PatientAppointments'

const DiabetesMedications = () => {
  // Get patient ID from token
  const getPatientIdFromToken = () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return null;

      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const user = JSON.parse(jsonPayload);
      return user?.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const patientId = getPatientIdFromToken();

  return (
    <div className="space-y-6">
      <MedicationReminders  />
      {patientId && (
        <div className="mt-8">
          <PatientAppointments patientId={patientId} />
        </div>
      )}
    </div>
  )
}

export default DiabetesMedications
