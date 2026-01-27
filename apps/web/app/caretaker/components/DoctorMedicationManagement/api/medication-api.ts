// FILE: app/caretaker/components/DoctorMedicationManagement/api/medication-api.ts

import { Medication, PatientInfo, DoctorInfo, SideEffect} from "../../types/medication-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Fetch doctor's prescriptions for a specific patient or all patients
 */
export const fetchDoctorPrescriptions = async (patientId?: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("No authentication token found");
  }

  let endpoint = '';
  let isPatientView = false;
  
  if (patientId) {
    endpoint = `${API_URL}/api/medications/reminders/doctor-view/${patientId}`;
    isPatientView = true;
  } else {
    endpoint = `${API_URL}/api/medications/reminders/side-effects/doctor-summary`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return { data: await response.json(), isPatientView };
};

/**
 * Delete a medication prescription
 */
export const deleteMedicationAPI = async (medicationId: string): Promise<boolean> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }

  const endpoint = `${API_URL}/api/medications/reminders/${medicationId}`;

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 403) {
      throw new Error('You can only delete medications you prescribed');
    } else if (response.status === 404) {
      throw new Error('Medication not found');
    } else {
      throw new Error(errorData?.message || 'Failed to delete medication');
    }
  }

  return true;
};

/**
 * Update medication status
 */
export const updateMedicationStatusAPI = async (
  medicationId: string, 
  newStatus: 'active' | 'completed' | 'stopped' | 'cancelled'
): Promise<boolean> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }

  const endpoint = `${API_URL}/api/medications/${medicationId}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      status: newStatus,
      lastUpdated: new Date().toISOString()
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 403) {
      throw new Error('You can only update medications you prescribed');
    } else if (response.status === 404) {
      throw new Error('Medication not found');
    } else {
      throw new Error(errorData?.message || 'Failed to update medication status');
    }
  }

  return true;
};

/**
 * Update side effect status with doctor notes
 */
export const updateSideEffectStatusAPI = async (
  medicationId: string, 
  effectIndex: number, 
  updates: { resolved: boolean; doctorNotes: string }
): Promise<boolean> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }

  const endpoint = `${API_URL}/api/medications/reminders/${medicationId}/side-effects/${effectIndex}/doctor-update`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update side effect');
  }

  return true;
};