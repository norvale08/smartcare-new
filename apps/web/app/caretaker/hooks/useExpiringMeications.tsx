import { useState, useEffect, useCallback } from 'react';

interface ExpiringMedication {
  _id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate: string;
  daysUntilExpiry: number;
  patient: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  status: string;
  alertSent: boolean;
}

interface ExpiringMedicationsData {
  medications: ExpiringMedication[];
  categorized: {
    expired: number;
    expiringToday: number;
    expiringIn3Days: number;
    expiringIn7Days: number;
  };
  totalExpiring: number;
  newAlerts: number;
}

export const useExpiringMedications = () => {
  const [data, setData] = useState<ExpiringMedicationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringMedications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/doctor/expiring`,
        {
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch expiring medications');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching expiring medications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpiringMedications();
    
    // Poll every 5 minutes for updates
    const interval = setInterval(fetchExpiringMedications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchExpiringMedications]);

  return {
    data,
    loading,
    error,
    refresh: fetchExpiringMedications
  };
};