// relative/dashboard/hooks/useDashboardData.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, PatientInfo, VitalRecord, HealthSummary, HealthStats, Medication } from '../types';
import { DashboardUtils, ApiService } from '../utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useDashboardData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientInfo | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bmiResult, setBmiResult] = useState<number | null>(null);

  const router = useRouter();

  const fetchMedications = useCallback(async (token: string, monitoredPatient?: string) => {
    if (!monitoredPatient) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/relative/patient-medications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const transformedMeds: Medication[] = data.data.map((med: any) => ({
            id: med._id || med.id,
            name: med.medicationName || med.name,
            dosage: med.dosage || 'N/A',
            frequency: med.frequency || 'As prescribed',
            nextDose: med.nextDose || DashboardUtils.calculateNextDose(med.frequency),
            lastTaken: med.lastTaken || med.lastDoseTaken,
            notes: med.notes || med.instructions,
            type: DashboardUtils.determineType(med.medicationName, med.purpose)
          }));

          setMedications(transformedMeds);
        }
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setMedications([]);
    }
  }, []);

  const fetchRelativeData = useCallback(async (relativeUser: User, token: string) => {
    try {
      const endpoints = [
        '/api/relative/patient-profile',
        '/api/relative/patient-vitals',
        '/api/relative/patient-summary',
        '/api/relative/patient-stats?days=30'
      ];

      const results = await ApiService.fetchRelativeData(token, endpoints);

      if (results['/api/relative/patient-profile']) {
        setPatientData(results['/api/relative/patient-profile']);
      }
      if (results['/api/relative/patient-vitals']) {
        setVitals(results['/api/relative/patient-vitals']);
      }
      if (results['/api/relative/patient-summary']) {
        setSummary(results['/api/relative/patient-summary']);
      }
      if (results['/api/relative/patient-stats?days=30']) {
        setStats(results['/api/relative/patient-stats?days=30']);
      }

      await fetchMedications(token, relativeUser.monitoredPatient);

    } catch (error) {
      console.error('Error fetching relative data:', error);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchMedications]);

  const handleRefresh = useCallback(async (token: string) => {
    if (isRefreshing || !user) return;

    setIsRefreshing(true);
    await fetchRelativeData(user, token);
    setIsRefreshing(false);
  }, [user, isRefreshing, fetchRelativeData]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'relative') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchRelativeData(parsedUser, token);
  }, [router, fetchRelativeData]);

  useEffect(() => {
    if (patientData?.weight && patientData?.height) {
      const bmi = DashboardUtils.calculateBMI(patientData.weight, patientData.height);
      setBmiResult(bmi);
    }
  }, [patientData]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        handleRefresh(token);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [user, handleRefresh]);

  return {
    user,
    loading,
    patientData,
    vitals,
    summary,
    stats,
    medications,
    isRefreshing,
    error,
    bmiResult,
    setError,
    handleRefresh,
    fetchRelativeData,
    fetchMedications
  };
}