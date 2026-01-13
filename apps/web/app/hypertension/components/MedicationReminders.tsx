// FILE: apps/web/app/patient/components/MedicationReminders.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from "../../../lib/hypertension/useTranslation";
import WeeklyCalendarTab from './medicationManagement/WeeklyCalendarTab';
import TodaysRemindersTab from './medicationManagement/TodaysReminderTab';
import RefreshBar from './medicationManagement/RefreshBar';
import AllergiesAlert from './medicationManagement/AllergiesAlert';
import ErrorDisplay from './medicationManagement/ErrorDisplay';
import TabNavigation from './medicationManagement/MedicineTabNavigation';

// Import shared interfaces
import { 
  Medication, 
  WeeklyResponse,
  WeeklyData
} from '../types/medication-types';

const MedicationReminders: React.FC = () => {
  const { t } = useTranslation();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('weekly');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const isEnglish = () => (t.language ?? "en-US") === "en-US";

  // Fetch weekly data
  const fetchWeeklyData = async (showLoader = true) => {
    try {
      console.log('🔄 Starting to fetch weekly data...');
      if (showLoader) setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const weekStartStr = currentWeekStart.toISOString().split('T')[0];

      console.log('📅 Fetching weekly data for:', weekStartStr);
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/weekly-adherence?weekStart=${weekStartStr}`;
      
      const response = await fetch(apiUrl, { 
        headers: { 
          Authorization: `Bearer ${token ?? ''}`,
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: WeeklyResponse = await response.json();
      
      if (result.success && result.data) {
        setWeeklyData(result.data);
      } else {
        setWeeklyData(null);
        setError(result.message || 'No data returned from server');
      }
      setLastRefreshed(new Date());
    } catch (error: any) {
      console.error('❌ Error fetching weekly data:', error);
      setError(error.message || 'Failed to load data');
      setWeeklyData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch today's medications
  const fetchTodayMedications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/today`,
        { 
          headers: { 
            Authorization: `Bearer ${token ?? ''}`,
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store'
        }
      );

      if (response.ok) {
        const result = await response.json();
        setMedications(result.data || []);
        setLastRefreshed(new Date());
      } else {
        throw new Error('Failed to fetch today medications');
      }
    } catch (error: any) {
      console.error('❌ Error fetching today medications:', error);
      setError(error.message || 'Failed to load today medications');
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when tab or week changes
  useEffect(() => {
    if (activeTab === 'weekly') {
      fetchWeeklyData();
    } else if (activeTab === 'today') {
      fetchTodayMedications();
    }
  }, [activeTab, currentWeekStart]);

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === 'weekly') {
      fetchWeeklyData(false);
    } else if (activeTab === 'today') {
      fetchTodayMedications();
    }
  };

  // Action handlers
  const markAsTaken = async (medicationId: string, date?: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/mark-taken`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: JSON.stringify({ dayDate: date })
        }
      );

      if (response.ok) {
        alert(isEnglish() ? 'Medication marked as taken' : 'Dawa imeandikwa kama iliyonywewa');
        handleRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark as taken');
      }
    } catch (error: any) {
      console.error('❌ Error marking medication as taken:', error);
      alert(error.message || (isEnglish() ? 'Failed to mark as taken' : 'Imeshindikana kuweka kama iliyonywewa'));
    }
  };

  const markAsMissed = async (medicationId: string, reason: string, date?: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/mark-missed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: JSON.stringify({ 
            reason, 
            dayDate: date 
          })
        }
      );

      if (response.ok) {
        alert(isEnglish() ? 'Medication marked as missed' : 'Dawa imeandikwa kama iliyopitwa');
        handleRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark as missed');
      }
    } catch (error: any) {
      console.error('❌ Error marking medication as missed:', error);
      alert(error.message || (isEnglish() ? 'Failed to mark as missed' : 'Imeshindikana kuweka kama iliyopitwa'));
    }
  };

  const stopTakingMedication = async (medicationId: string, reason: string, notes?: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/stop-taking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: JSON.stringify({
            reason,
            notes
          })
        }
      );

      if (response.ok) {
        alert(isEnglish() 
          ? 'Medication marked as stopped. Your doctor has been notified.' 
          : 'Dawa imeandikwa kama iliyoachwa. Daktari wako ameahirishwa.');
        handleRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop medication');
      }
    } catch (error: any) {
      console.error('❌ Error stopping medication:', error);
      alert(error.message || (isEnglish() ? 'Failed to stop medication' : 'Imeshindikana kuacha dawa'));
    }
  };

  const restartTakingMedication = async (medicationId: string) => {
    if (!confirm(isEnglish() 
      ? 'Are you sure you want to restart taking this medication?' 
      : 'Una uhakika unataka kuanza kutumia dawa hii tena?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/restart-taking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: JSON.stringify({ reason: 'Patient restarted medication' })
        }
      );

      if (response.ok) {
        alert(isEnglish() ? 'Medication restarted successfully' : 'Dawa imeanzishwa tena kwa mafanikio');
        handleRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to restart medication');
      }
    } catch (error: any) {
      console.error('❌ Error restarting medication:', error);
      alert(error.message || (isEnglish() ? 'Failed to restart medication' : 'Imeshindikana kuanzisha dawa tena'));
    }
  };

  const deleteMedication = async (medicationId: string) => {
    if (!confirm(isEnglish() 
      ? 'Are you sure you want to delete this medication? This action cannot be undone.' 
      : 'Una uhakika unataka kufuta dawa hii? Hii hatuiwezeshi kufuta.')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          }
        }
      );

      if (response.ok) {
        alert(isEnglish() ? 'Medication deleted successfully' : 'Dawa imefutwa kwa mafanikio');
        handleRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete medication');
      }
    } catch (error: any) {
      console.error('❌ Error deleting medication:', error);
      alert(error.message || (isEnglish() ? 'Failed to delete medication' : 'Imeshindikana kufuta dawa'));
    }
  };

  const reportSideEffect = async (medicationId: string, data: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/report-side-effect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: JSON.stringify({
            sideEffectName: data.name,
            severity: data.severity,
            notes: data.notes,
            intensity: data.intensity
          })
        }
      );

      if (response.ok) {
        alert(isEnglish() ? 'Side effect reported successfully' : 'Athari imeripotiwa kwa mafanikio');
        handleRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to report side effect');
      }
    } catch (error: any) {
      console.error('❌ Error reporting side effect:', error);
      alert(error.message || (isEnglish() ? 'Failed to report side effect' : 'Imeshindikana kuripoti athari'));
    }
  };

  // Get unique allergies from medications
  const allAllergies = medications
    .flatMap(med => med.patientAllergies || [])
    .map(allergy => typeof allergy === 'string' ? allergy : allergy.allergyName)
    .filter((allergy, index, array) => array.indexOf(allergy) === index);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      <ErrorDisplay error={error} />

      {/* Tabs */}
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isEnglish={isEnglish}
      />

      {/* Refresh Button Bar */}
      <RefreshBar
        refreshing={refreshing}
        handleRefresh={handleRefresh}
        lastRefreshed={lastRefreshed}
        isEnglish={isEnglish}
      />

      {/* Allergies Alert */}
      {allAllergies.length > 0 && (
        <AllergiesAlert 
          allergies={allAllergies}
          isEnglish={isEnglish}
        />
      )}

      {/* Main Content */}
      {activeTab === 'weekly' ? (
        <WeeklyCalendarTab
          weeklyData={weeklyData}
          loading={loading}
          currentWeekStart={currentWeekStart}
          setCurrentWeekStart={setCurrentWeekStart}
          isEnglish={isEnglish}
          onRefresh={handleRefresh}
          onMarkAsTaken={markAsTaken}
          onMarkAsMissed={(medicationId: string, date?: string) => {
            // This will be handled via dialog in WeeklyCalendarTable
          }}
          onStopMedication={(medicationId: string) => {
            // This will be handled via dialog in WeeklyCalendarTable
          }}
          onRestartMedication={restartTakingMedication}
          onDeleteMedication={deleteMedication}
        />
      ) : (
        // In MedicationReminders.tsx, update the TodaysRemindersTab usage:
<TodaysRemindersTab
  medications={medications}
  isEnglish={isEnglish}
  onRefresh={handleRefresh}
  onMarkAsTaken={markAsTaken}
  onMarkAsMissed={(medicationId: string, reason: string) => {
    // For today's view, no date parameter needed
    markAsMissed(medicationId, reason);
  }}
  onStopMedication={stopTakingMedication}
  onRestartMedication={restartTakingMedication}
  onDeleteMedication={deleteMedication}
  onReportSideEffect={reportSideEffect}
/>
      )}
    </div>
  );
};

export default MedicationReminders;