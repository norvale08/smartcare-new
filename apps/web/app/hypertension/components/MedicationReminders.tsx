// FILE: apps/web/app/patient/components/MedicationReminders.tsx
import React, { useState, useEffect } from 'react';
import { 
  Pill, Clock, CheckCircle, AlertCircle, Bell, AlertTriangle, 
  Info, RefreshCw, XCircle, PlayCircle, CalendarDays,
  ChevronLeft, ChevronRight, Pause, Calendar, RotateCw,
  MessageSquare, UserCheck, FileText
} from 'lucide-react';
import { useTranslation } from "../../../lib/hypertension/useTranslation";

// Updated interfaces
interface Allergy {
  allergyName: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  notes?: string;
}

interface PotentialSideEffect {
  name: string;
  severity: 'common' | 'uncommon' | 'rare';
  description?: string;
}

interface ExperiencedSideEffect {
  sideEffectName: string;
  reportedAt: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  intensity?: string;
  resolved?: boolean;
  resolvedAt?: string;
  doctorNotes?: string;
  doctorId?: string;
  lastUpdated?: string;
}

interface Medication {
  _id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  reminders: string[];
  status: 'active' | 'completed' | 'missed' | 'stopped';
  adherence?: {
    currentStatus: 'taken' | 'missed' | 'stopped';
    reasonForStopping?: string;
    stoppedAt?: string;
    history?: Array<{
      date: string;
      status: string;
      reason?: string;
      notes?: string;
    }>;
  };
  patientAllergies: Allergy[];
  potentialSideEffects: PotentialSideEffect[];
  experiencedSideEffects: ExperiencedSideEffect[];
  lastTaken?: string;
  takenHistory?: Array<{
    takenAt: string;
    doseTime: string;
  }>;
  prescribedBy?: {
    fullName: string;
    specialization?: string;
  };
}

interface WeekDay {
  name: string;
  date: string;
  formatted: string;
  isToday: boolean;
  isPast: boolean;
}

interface WeeklyMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  status: string;
  patientAllergies: Allergy[];
  experiencedSideEffects: ExperiencedSideEffect[];
  weeklyData: {
    [date: string]: {
      taken: boolean;
      status: 'pending' | 'taken' | 'missed' | 'stopped';
      takenTime: string | null;
      isToday: boolean;
      isPast: boolean;
    };
  };
}

interface WeeklyResponse {
  success: boolean;
  data?: {
    weekStart: string;
    weekEnd: string;
    weekDays: WeekDay[];
    medications: WeeklyMedication[];
    summary: {
      totalMedications: number;
      activeMedications: number;
      takenThisWeek: number;
      missedThisWeek: number;
      pendingThisWeek: number;
    };
  };
  message?: string;
}

const MedicationReminders: React.FC = () => {
  const { t } = useTranslation();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyResponse['data'] | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSideEffects, setShowSideEffects] = useState<{ [key: string]: boolean }>({});
  const [showReportSideEffect, setShowReportSideEffect] = useState<{ [key: string]: boolean }>({});
  const [selectedSideEffects, setSelectedSideEffects] = useState<{ [medicationId: string]: string[] }>({});
  const [showStopDialog, setShowStopDialog] = useState<{ [key: string]: boolean }>({});
  const [showMissDialog, setShowMissDialog] = useState<{ [key: string]: boolean }>({});
  const [stopReasons, setStopReasons] = useState<{ [key: string]: string }>({});
  const [stopNotes, setStopNotes] = useState<{ [key: string]: string }>({});
  const [missReasons, setMissReasons] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('weekly');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for reporting side effects
  const [newSideEffect, setNewSideEffect] = useState<{ [key: string]: {
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes: string;
    intensity: 'mild' | 'moderate' | 'severe' | 'very severe';
  } }>({});

  const toggleSideEffect = (medicationId: string, effectName: string) => {
    setSelectedSideEffects(prev => {
      const current = prev[medicationId] || [];
      const exists = current.includes(effectName);

      return {
        ...prev,
        [medicationId]: exists
          ? current.filter(name => name !== effectName)
          : [...current, effectName],
      };
    });
  };

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
      console.log('🌐 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, { 
        headers: { 
          Authorization: `Bearer ${token ?? ''}`,
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: WeeklyResponse = await response.json();
      console.log('✅ Weekly response received:', result);
      
      if (result.success && result.data) {
        console.log('📊 Data loaded successfully:', {
          medications: result.data.medications?.length || 0,
          weekDays: result.data.weekDays?.length || 0,
          summary: result.data.summary
        });
        
        setWeeklyData(result.data);
      } else {
        console.error('❌ No data in response:', result.message);
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
        console.log('✅ Today medications received:', result.data?.length || 0);
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
    console.log(`📝 Effect triggered - Active tab: ${activeTab}, Week start: ${currentWeekStart.toISOString()}`);
    if (activeTab === 'weekly') {
      fetchWeeklyData();
    } else if (activeTab === 'today') {
      fetchTodayMedications();
    }
  }, [activeTab, currentWeekStart]);

  // Handle refresh
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered for tab:', activeTab);
    if (activeTab === 'weekly') {
      fetchWeeklyData(false);
    } else if (activeTab === 'today') {
      fetchTodayMedications();
    }
  };

  // Navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    console.log(`📅 Navigating week: ${direction}`);
    const newDate = new Date(currentWeekStart);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    console.log('📅 Going to current week');
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  // Format last refreshed time
  const formatLastRefreshed = () => {
    if (!lastRefreshed) return '';
    const diff = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
    
    if (diff < 60) {
      return isEnglish() ? 'Just now' : 'Hivi sasa';
    } else if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return isEnglish() ? `${mins} minute${mins !== 1 ? 's' : ''} ago` : `${mins} dakika zilizopita`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return isEnglish() ? `${hours} hour${hours !== 1 ? 's' : ''} ago` : `${hours} saa zilizopita`;
    } else {
      return lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  const markAsMissed = async (medicationId: string, date?: string) => {
    const reason = missReasons[medicationId];
    if (!reason) {
      alert(isEnglish() ? 'Please provide a reason for missing' : 'Tafadhali toa sababu ya kupitwa');
      return;
    }

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
        setShowMissDialog(prev => ({ ...prev, [medicationId]: false }));
        setMissReasons(prev => ({ ...prev, [medicationId]: '' }));
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

  // New function to report side effect
  const reportSideEffect = async (medicationId: string) => {
    const sideEffect = newSideEffect[medicationId];
    if (!sideEffect || !sideEffect.name.trim()) {
      alert(isEnglish() ? 'Please enter a side effect name' : 'Tafadhali ingiza jina la athari');
      return;
    }

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
            sideEffectName: sideEffect.name,
            severity: sideEffect.severity,
            notes: sideEffect.notes,
            intensity: sideEffect.intensity
          })
        }
      );

      if (response.ok) {
        setShowReportSideEffect(prev => ({ ...prev, [medicationId]: false }));
        setNewSideEffect(prev => ({ ...prev, [medicationId]: { name: '', severity: 'mild', notes: '', intensity: 'moderate' } }));
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

  const stopTakingMedication = async (medicationId: string) => {
    const reason = stopReasons[medicationId];
    const notes = stopNotes[medicationId];

    if (!reason) {
      alert(isEnglish() ? 'Please provide a reason for stopping' : 'Tafadhali toa sababu ya kuacha');
      return;
    }

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
        setShowStopDialog(prev => ({ ...prev, [medicationId]: false }));
        setStopReasons(prev => ({ ...prev, [medicationId]: '' }));
        setStopNotes(prev => ({ ...prev, [medicationId]: '' }));
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

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'stopped': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'stopped': return <Pause className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
      case 'very severe': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'common': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'uncommon': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rare': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatWeekRange = () => {
    if (!weeklyData || !weeklyData.weekStart || !weeklyData.weekEnd) return '';
    try {
      const start = new Date(weeklyData.weekStart);
      const end = new Date(weeklyData.weekEnd);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch (error) {
      console.error('Error formatting week range:', error);
      return 'Invalid date';
    }
  };

  // Get unique allergies from medications
  const allAllergies = medications
    .flatMap(med => med.patientAllergies || [])
    .map(allergy => typeof allergy === 'string' ? allergy : allergy.allergyName)
    .filter((allergy, index, array) => array.indexOf(allergy) === index);

  const activeMedications = medications.filter(med => med.status === 'active');
  const stoppedMedications = medications.filter(med => med.status === 'stopped');

  // Loading state
  if (loading && activeTab === 'weekly' && !weeklyData) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <div className="animate-pulse">
          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading medication calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'weekly' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarDays className="inline-block w-4 h-4 mr-2" />
            {isEnglish() ? 'Weekly Calendar' : 'Kalenda ya Wiki'}
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'today' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Bell className="inline-block w-4 h-4 mr-2" />
            {isEnglish() ? 'Today\'s Reminders' : 'Kumbusho za Leo'}
          </button>
        </nav>
      </div>

      {/* Refresh Button Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all ${refreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? (isEnglish() ? 'Refreshing...' : 'Inasasishwa...') : (isEnglish() ? 'Refresh Data' : 'Onyesha Upya Data')}</span>
            </button>
            
            {lastRefreshed && (
              <div className="text-sm text-blue-700">
                <span className="font-medium">{isEnglish() ? 'Last updated:' : 'Imesasishwa:'}</span> {formatLastRefreshed()}
              </div>
            )}
          </div>
          
          <div className="text-sm text-blue-600 flex items-center">
            <Info className="w-4 h-4 mr-2" />
            {isEnglish() ? 'Click refresh to update status changes' : 'Bofya onyesha upya kusasisha mabadiliko ya hali'}
          </div>
        </div>
      </div>

      {/* Allergies Alert */}
      {allAllergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                {isEnglish() ? "Your Allergies" : "Mzio Wako"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {allAllergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-800 rounded-lg text-sm font-medium flex items-center"
                  >
                    <AlertTriangle className="w-3 h-3 mr-2 text-red-600" />
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'weekly' ? (
        weeklyData ? (
          <div className="space-y-6">
            {/* Weekly Header */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {isEnglish() ? 'Weekly Medication Tracker' : 'Kufuatilia Dawa za Wiki'}
                    </h3>
                    <p className="text-sm text-gray-500">{formatWeekRange()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateWeek('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isEnglish() ? 'Previous week' : 'Wiki iliyopita'}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToCurrentWeek}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    {isEnglish() ? 'Current Week' : 'Wiki ya Sasa'}
                  </button>
                  <button
                    onClick={() => navigateWeek('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isEnglish() ? 'Next week' : 'Wiki ijayo'}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Weekly Summary */}
              {weeklyData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700 mb-1">
                      {isEnglish() ? 'Active Medications' : 'Dawa Zinazotumika'}
                    </p>
                    <p className="text-xl font-bold text-blue-900">{weeklyData.summary.activeMedications}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 mb-1">
                      {isEnglish() ? 'Taken This Week' : 'Zilizonywewa Wiki Hii'}
                    </p>
                    <p className="text-xl font-bold text-green-900">{weeklyData.summary.takenThisWeek}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700 mb-1">
                      {isEnglish() ? 'Missed This Week' : 'Zilizopitwa Wiki Hii'}
                    </p>
                    <p className="text-xl font-bold text-red-900">{weeklyData.summary.missedThisWeek}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-700 mb-1">
                      {isEnglish() ? 'Pending This Week' : 'Zinazongoza Wiki Hii'}
                    </p>
                    <p className="text-xl font-bold text-yellow-900">{weeklyData.summary.pendingThisWeek}</p>
                  </div>
                </div>
              )}

              {/* Weekly Calendar */}
              {weeklyData.weekDays && weeklyData.weekDays.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-3 bg-gray-50 border-b font-medium text-gray-700 sticky left-0 z-10">
                          {isEnglish() ? 'Medication' : 'Dawa'}
                        </th>
                        {weeklyData.weekDays.map((day) => (
                          <th key={day.date} className="text-center p-3 bg-gray-50 border-b min-w-[100px]">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium">{day.name.slice(0, 3)}</span>
                              <span className={`text-xs ${day.isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                {day.date.split('-')[2]}
                              </span>
                              {day.isToday && (
                                <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="text-center p-3 bg-gray-50 border-b font-medium text-gray-700">
                          {isEnglish() ? 'Actions' : 'Vitendo'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.medications && weeklyData.medications.length > 0 ? (
                        weeklyData.medications.map((medication) => {
                          const today = new Date().toISOString().split('T')[0];
                          const isActive = medication.status === 'active';
                          
                          return (
                            <tr key={medication.medicationId} className="border-b hover:bg-gray-50">
                              <td className="p-3 sticky left-0 bg-white z-10">
                                <div>
                                  <div className="font-medium">{medication.medicationName}</div>
                                  <div className="text-sm text-gray-600">{medication.dosage}</div>
                                  <div className="text-xs text-gray-500">{medication.frequency}</div>
                                  
                                  {/* Display allergies */}
                                  {medication.patientAllergies && medication.patientAllergies.length > 0 && (
                                    <div className="mt-1">
                                      <div className="flex flex-wrap gap-1">
                                        {medication.patientAllergies.slice(0, 2).map((allergy, index) => {
                                          const allergyName = typeof allergy === 'string' ? allergy : allergy.allergyName;
                                          return (
                                            <span
                                              key={index}
                                              className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200"
                                            >
                                              {allergyName}
                                            </span>
                                          );
                                        })}
                                        {medication.patientAllergies.length > 2 && (
                                          <span className="text-xs text-red-600">
                                            +{medication.patientAllergies.length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {!isActive && (
                                    <div className="text-xs text-red-600 mt-1 font-medium">
                                      {isEnglish() ? 'Stopped' : 'Imeachwa'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              {weeklyData.weekDays.map((day) => {
                                const dayData = medication.weeklyData?.[day.date];
                                const status = dayData?.status || (day.isPast && isActive ? 'missed' : 'pending');
                                const taken = dayData?.taken || false;
                                const takenTime = dayData?.takenTime || null;
                                
                                return (
                                  <td key={`${medication.medicationId}-${day.date}`} className="text-center p-3">
                                    <div className="flex flex-col items-center">
                                      <div className={`p-2 rounded-lg border ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                      </div>
                                      {takenTime && (
                                        <span className="text-xs mt-1 text-gray-600">{takenTime}</span>
                                      )}
                                      {day.isToday && isActive && status === 'pending' && (
                                        <div className="mt-2 space-y-1">
                                          <button
                                            onClick={() => markAsTaken(medication.medicationId, day.date)}
                                            className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors w-full"
                                          >
                                            {isEnglish() ? 'Taken' : 'Imenywewa'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setShowMissDialog(prev => ({ ...prev, [medication.medicationId]: true }));
                                            }}
                                            className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors w-full"
                                          >
                                            {isEnglish() ? 'Missed' : 'Imepitwa'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="p-3">
                                <div className="flex flex-col space-y-2">
                                  {isActive ? (
                                    <button
                                      onClick={() => setShowStopDialog(prev => ({ ...prev, [medication.medicationId]: true }))}
                                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      {isEnglish() ? 'Stop' : 'Acha'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => restartTakingMedication(medication.medicationId)}
                                      className="px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                      <PlayCircle className="w-4 h-4 mr-1" />
                                      {isEnglish() ? 'Restart' : 'Anzisha Tena'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={weeklyData.weekDays.length + 2} className="text-center p-8">
                            <div className="text-center py-8">
                              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {isEnglish() ? 'No Medications Found' : 'Hakuna Dawa Zilizopatikana'}
                              </h3>
                              <p className="text-gray-500">
                                {isEnglish() 
                                  ? "You don't have any medications prescribed yet. Please ask your doctor to prescribe medications." 
                                  : "Huna dawa zozote zilizopendekeza bado. Tafadhali omba daktari wako akupendekeze dawa."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isEnglish() ? 'No Calendar Data' : 'Hakuna Data ya Kalenda'}
                  </h3>
                  <p className="text-gray-500">
                    {isEnglish() 
                      ? "Unable to generate calendar. Please try refreshing." 
                      : "Haikuweza kuzalisha kalenda. Tafadhali jaribu kupakia upya."}
                  </p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-gray-700 mb-3">
                {isEnglish() ? 'Status Legend' : 'Maelezo ya Hali'}
              </h4>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                  <span className="text-sm">{isEnglish() ? 'Taken' : 'Imenywewa'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                  <span className="text-sm">{isEnglish() ? 'Missed' : 'Imepitwa'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
                  <span className="text-sm">{isEnglish() ? 'Pending' : 'Inangojea'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                  <span className="text-sm">{isEnglish() ? 'Stopped' : 'Imeachwa'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isEnglish() ? 'No Weekly Data Available' : 'Hakuna Data ya Wiki'}
            </h3>
            <p className="text-gray-500">
              {isEnglish() 
                ? "Unable to load weekly medication data. Please try refreshing or contact support if the issue persists." 
                : "Haikuweza kupakua data ya dawa za wiki. Tafadhali jaribu kupakia upya au wasiliana na msaada ikiwa tatizo linaendelea."}
            </p>
          </div>
        )
      ) : (
        /* Today's Reminders Tab */
        <div className="space-y-4">
          {activeMedications.length === 0 && stoppedMedications.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isEnglish() ? 'No Medications Prescribed' : 'Hakuna Dawa Zilizopendekeza'}
              </h3>
              <p className="text-gray-500">
                {isEnglish() 
                  ? "You have no medications prescribed yet. Your medications will appear here once your doctor prescribes them." 
                  : "Bado huna dawa zilizopendekeza. Dawa zako zitaonekana hapa baada ya daktari wako kukupendekeza."}
              </p>
            </div>
          ) : (
            <>
              {/* Active Medications */}
              {activeMedications.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">
                    {isEnglish() ? "Active Medications" : "Dawa Zinazotumika"} ({activeMedications.length})
                  </h4>
                  <div className="space-y-4">
                    {activeMedications.map(medication => {
                      const showStopModal = showStopDialog[medication._id];
                      const showMissModal = showMissDialog[medication._id];
                      const showEffects = showSideEffects[medication._id];
                      const showReportEffect = showReportSideEffect[medication._id];
                      const sideEffect = newSideEffect[medication._id] || { name: '', severity: 'mild' as const, notes: '', intensity: 'moderate' as const };

                      return (
                        <div key={medication._id} className="bg-white rounded-lg border p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Pill className="w-5 h-5 text-blue-600" />
                                <h4 className="font-medium text-gray-900">{medication.medicationName}</h4>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                  {isEnglish() ? 'Active' : 'Inatumika'}
                                </span>
                                {medication.lastTaken && (
                                  <span className="text-xs text-green-600">
                                    {isEnglish() ? 'Last taken:' : 'Ilinyonywa:'} {new Date(medication.lastTaken).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>{isEnglish() ? 'Dosage:' : 'Kipimo:'}</strong> {medication.dosage}</p>
                                <p><strong>{isEnglish() ? 'Frequency:' : 'Mara ngapi:'}</strong> {medication.frequency}</p>
                                {medication.instructions && (
                                  <p><strong>{isEnglish() ? 'Instructions:' : 'Maelekezo:'}</strong> {medication.instructions}</p>
                                )}
                              </div>

                              {/* Patient Allergies */}
                              {medication.patientAllergies && medication.patientAllergies.length > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-xs font-semibold text-red-700 mb-2 flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {isEnglish() ? "Your Allergies:" : "Mzio Wako:"}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {medication.patientAllergies.map((allergy, index) => {
                                      const allergyObj = typeof allergy === 'string' ? { allergyName: allergy, severity: 'mild', reaction: '' } : allergy;
                                      return (
                                        <div key={index} className="bg-white border border-red-300 rounded-lg p-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-red-900">{allergyObj.allergyName}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                              allergyObj.severity === 'severe' ? 'bg-red-200 text-red-900' :
                                              allergyObj.severity === 'moderate' ? 'bg-orange-200 text-orange-900' :
                                              'bg-yellow-200 text-yellow-900'
                                            }`}>
                                              {allergyObj.severity}
                                            </span>
                                          </div>
                                          {allergyObj.reaction && (
                                            <p className="text-xs text-red-700 mt-1">{allergyObj.reaction}</p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Side Effects Section */}
                              {medication.potentialSideEffects && medication.potentialSideEffects.length > 0 && (
                                <div className="mt-4 border-t pt-3">
                                  <button
                                    onClick={() => setShowSideEffects(prev => ({ ...prev, [medication._id]: !showEffects }))}
                                    className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                  >
                                    <Info className="w-4 h-4" />
                                    <span>
                                      {isEnglish()
                                        ? `Possible Side Effects (${medication.potentialSideEffects.length})`
                                        : `Athari Zinazowezekana (${medication.potentialSideEffects.length})`}
                                    </span>
                                    <span className="text-xs">{showEffects ? '▼' : '▶'}</span>
                                  </button>

                                  {showEffects && (
                                    <div className="mt-3 space-y-2 bg-orange-50 p-3 rounded border border-orange-200">
                                      <p className="text-xs text-gray-600 mb-2">
                                        {isEnglish()
                                          ? "Check any side effects you're experiencing:"
                                          : "Chagua athari zozote unazopata:"}
                                      </p>
                                      {medication.potentialSideEffects.map((effect, index) => {
                                        const effectObj = typeof effect === 'string' ? { name: effect, severity: 'common', description: '' } : effect;
                                        return (
                                          <label
                                            key={`${medication._id}-${effectObj.name}-${index}`}
                                            className="flex items-start space-x-3 p-2 hover:bg-orange-100 rounded cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={(selectedSideEffects[medication._id] || []).includes(effectObj.name)}
                                              onChange={() => toggleSideEffect(medication._id, effectObj.name)}
                                              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-gray-900">{effectObj.name}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effectObj.severity)}`}>
                                                  {effectObj.severity}
                                                </span>
                                              </div>
                                              {effectObj.description && <p className="text-xs text-gray-600 mt-1">{effectObj.description}</p>}
                                            </div>
                                          </label>
                                        );
                                      })}
                                      
                                      {/* Report New Side Effect Button */}
                                      <div className="pt-2">
                                        <button
                                          onClick={() => setShowReportSideEffect(prev => ({ ...prev, [medication._id]: !showReportEffect }))}
                                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                                        >
                                          <MessageSquare className="w-4 h-4" />
                                          <span>{isEnglish() ? 'Report a new side effect' : 'Ripoti athari mpya'}</span>
                                        </button>
                                        
                                        {showReportEffect && (
                                          <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
                                            <h5 className="text-sm font-medium text-blue-800 mb-2">
                                              {isEnglish() ? 'Report Side Effect' : 'Ripoti Athari'}
                                            </h5>
                                            <div className="space-y-3">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                  {isEnglish() ? 'Side Effect Name *' : 'Jina la Athari *'}
                                                </label>
                                                <input
                                                  type="text"
                                                  value={sideEffect.name}
                                                  onChange={(e) => setNewSideEffect(prev => ({
                                                    ...prev,
                                                    [medication._id]: { ...sideEffect, name: e.target.value }
                                                  }))}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                  placeholder={isEnglish() ? 'e.g., Nausea, Headache' : 'mf., Kichefuchefu, Maumivu ya kichwa'}
                                                />
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    {isEnglish() ? 'Severity' : 'Ukali'}
                                                  </label>
                                                  <select
                                                    value={sideEffect.severity}
                                                    onChange={(e) => setNewSideEffect(prev => ({
                                                      ...prev,
                                                      [medication._id]: { ...sideEffect, severity: e.target.value as 'mild' | 'moderate' | 'severe' }
                                                    }))}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                  >
                                                    <option value="mild">{isEnglish() ? 'Mild' : 'Nyepesi'}</option>
                                                    <option value="moderate">{isEnglish() ? 'Moderate' : 'Wastani'}</option>
                                                    <option value="severe">{isEnglish() ? 'Severe' : 'Kali'}</option>
                                                  </select>
                                                </div>
                                                
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    {isEnglish() ? 'Intensity' : 'Mkubwa'}
                                                  </label>
                                                  <select
                                                    value={sideEffect.intensity}
                                                    onChange={(e) => setNewSideEffect(prev => ({
                                                      ...prev,
                                                      [medication._id]: { ...sideEffect, intensity: e.target.value as 'mild' | 'moderate' | 'severe' | 'very severe' }
                                                    }))}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                  >
                                                    <option value="mild">{isEnglish() ? 'Mild' : 'Nyepesi'}</option>
                                                    <option value="moderate">{isEnglish() ? 'Moderate' : 'Wastani'}</option>
                                                    <option value="severe">{isEnglish() ? 'Severe' : 'Kali'}</option>
                                                    <option value="very severe">{isEnglish() ? 'Very Severe' : 'Kali Sana'}</option>
                                                  </select>
                                                </div>
                                              </div>
                                              
                                              <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                  {isEnglish() ? 'Notes (optional)' : 'Maelezo (hiari)'}
                                                </label>
                                                <textarea
                                                  value={sideEffect.notes}
                                                  onChange={(e) => setNewSideEffect(prev => ({
                                                    ...prev,
                                                    [medication._id]: { ...sideEffect, notes: e.target.value }
                                                  }))}
                                                  rows={2}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                                  placeholder={isEnglish() ? 'Describe the side effect...' : 'Elezea athari...'}
                                                />
                                              </div>
                                              
                                              <div className="flex space-x-2">
                                                <button
                                                  onClick={() => {
                                                    setShowReportSideEffect(prev => ({ ...prev, [medication._id]: false }));
                                                    setNewSideEffect(prev => ({ ...prev, [medication._id]: { name: '', severity: 'mild', notes: '', intensity: 'moderate' } }));
                                                  }}
                                                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm"
                                                >
                                                  {isEnglish() ? 'Cancel' : 'Ghairi'}
                                                </button>
                                                <button
                                                  onClick={() => reportSideEffect(medication._id)}
                                                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                                >
                                                  {isEnglish() ? 'Report' : 'Ripoti'}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Experienced Side Effects */}
                              {medication.experiencedSideEffects && medication.experiencedSideEffects.length > 0 && (
                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {isEnglish() ? "Reported Side Effects:" : "Athari Zilizoripotiwa:"} ({medication.experiencedSideEffects.length})
                                  </p>
                                  <div className="space-y-2">
                                    {medication.experiencedSideEffects.map((effect, index) => (
                                      <div key={index} className="bg-white border border-orange-300 rounded p-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">{effect.sideEffectName}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effect.severity)}`}>
                                              {effect.severity}
                                            </span>
                                            {effect.intensity && (
                                              <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(effect.intensity)}`}>
                                                {effect.intensity}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-xs text-gray-500">
                                            {new Date(effect.reportedAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                        
                                        {effect.notes && (
                                          <p className="text-xs text-gray-600 mt-1">{effect.notes}</p>
                                        )}
                                        
                                        {/* Doctor Information */}
                                        {effect.doctorNotes && (
                                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                            <div className="flex items-center gap-2 mb-1">
                                              <UserCheck className="w-3 h-3 text-blue-600" />
                                              <span className="text-xs font-medium text-blue-800">
                                                {isEnglish() ? 'Doctor Notes:' : 'Maelezo ya Daktari:'}
                                              </span>
                                            </div>
                                            <p className="text-xs text-blue-700">{effect.doctorNotes}</p>
                                            {effect.resolved && (
                                              <div className="flex items-center gap-1 mt-1">
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                <span className="text-xs text-green-700 font-medium">
                                                  {isEnglish() ? 'Resolved' : 'Imetatuliwa'}
                                                </span>
                                                {effect.resolvedAt && (
                                                  <span className="text-xs text-gray-500">
                                                    on {new Date(effect.resolvedAt).toLocaleDateString()}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <button
                                onClick={() => markAsTaken(medication._id)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm flex items-center transition-colors whitespace-nowrap"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {isEnglish() ? 'Taken' : 'Imenywewa'}
                              </button>
                              <button
                                onClick={() => setShowMissDialog(prev => ({ ...prev, [medication._id]: true }))}
                                className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm flex items-center transition-colors whitespace-nowrap"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                {isEnglish() ? 'Missed' : 'Imepitwa'}
                              </button>
                              <button
                                onClick={() => setShowStopDialog(prev => ({ ...prev, [medication._id]: true }))}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm flex items-center transition-colors whitespace-nowrap"
                              >
                                <Pause className="w-4 h-4 mr-1" />
                                {isEnglish() ? 'Stop' : 'Acha'}
                              </button>
                            </div>
                          </div>

                          {/* Miss Medication Dialog */}
                          {showMissModal && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <h5 className="font-medium text-red-800 mb-2">
                                {isEnglish() ? 'Why did you miss this medication?' : 'Kwa nini umepitwa na dawa hii?'}
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-red-700 mb-1">
                                    {isEnglish() ? 'Reason *' : 'Sababu *'}
                                  </label>
                                  <select
                                    value={missReasons[medication._id] || ''}
                                    onChange={(e) => setMissReasons(prev => ({ ...prev, [medication._id]: e.target.value }))}
                                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                  >
                                    <option value="">{isEnglish() ? 'Select a reason' : 'Chagua sababu'}</option>
                                    <option value="forgot">{isEnglish() ? 'Forgot to take' : 'Nimesahau kunywa'}</option>
                                    <option value="not_available">{isEnglish() ? 'Medication not available' : 'Dawa haipo'}</option>
                                    <option value="side_effects">{isEnglish() ? 'Due to side effects' : 'Kutokana na athari'}</option>
                                    <option value="felt_better">{isEnglish() ? 'Felt better' : 'Nilijisikia vizuri'}</option>
                                    <option value="other">{isEnglish() ? 'Other' : 'Nyingine'}</option>
                                  </select>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setShowMissDialog(prev => ({ ...prev, [medication._id]: false }));
                                      setMissReasons(prev => ({ ...prev, [medication._id]: '' }));
                                    }}
                                    className="flex-1 py-2 px-4 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                                  >
                                    {isEnglish() ? 'Cancel' : 'Ghairi'}
                                  </button>
                                  <button
                                    onClick={() => markAsMissed(medication._id)}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    {isEnglish() ? 'Confirm Missed' : 'Thibitisha Kupitwa'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Stop Medication Dialog */}
                          {showStopModal && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <h5 className="font-medium text-red-800 mb-2">
                                {isEnglish() ? 'Why are you stopping this medication?' : 'Kwa nini unaacha kutumia dawa hii?'}
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-red-700 mb-1">
                                    {isEnglish() ? 'Reason *' : 'Sababu *'}
                                  </label>
                                  <select
                                    value={stopReasons[medication._id] || ''}
                                    onChange={(e) => setStopReasons(prev => ({ ...prev, [medication._id]: e.target.value }))}
                                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                  >
                                    <option value="">{isEnglish() ? 'Select a reason' : 'Chagua sababu'}</option>
                                    <option value="side_effects">{isEnglish() ? 'Side effects' : 'Athari mbaya'}</option>
                                    <option value="feeling_better">{isEnglish() ? 'Feeling better' : 'Najisikia vizuri'}</option>
                                    <option value="forgot_to_take">{isEnglish() ? 'Forgot to take' : 'Nimesahau kunywa'}</option>
                                    <option value="too_expensive">{isEnglish() ? 'Too expensive' : 'Ni ghali sana'}</option>
                                    <option value="doctor_advised">{isEnglish() ? 'Doctor advised' : 'Daktari ameshauri'}</option>
                                    <option value="other">{isEnglish() ? 'Other' : 'Nyingine'}</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-red-700 mb-1">
                                    {isEnglish() ? 'Additional notes (optional)' : 'Maelezo ya ziada (hiari)'}
                                  </label>
                                  <textarea
                                    value={stopNotes[medication._id] || ''}
                                    onChange={(e) => setStopNotes(prev => ({ ...prev, [medication._id]: e.target.value }))}
                                    rows={2}
                                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder={isEnglish() ? 'Tell us more...' : 'Tuambie zaidi...'}
                                  />
                                </div>

                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setShowStopDialog(prev => ({ ...prev, [medication._id]: false }));
                                      setStopReasons(prev => ({ ...prev, [medication._id]: '' }));
                                      setStopNotes(prev => ({ ...prev, [medication._id]: '' }));
                                    }}
                                    className="flex-1 py-2 px-4 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                                  >
                                    {isEnglish() ? 'Cancel' : 'Ghairi'}
                                  </button>
                                  <button
                                    onClick={() => stopTakingMedication(medication._id)}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    {isEnglish() ? 'Confirm Stop' : 'Thibitisha Kuacha'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stopped Medications */}
              {stoppedMedications.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">
                    {isEnglish() ? "Stopped Medications" : "Dawa Zilizoachwa"} ({stoppedMedications.length})
                  </h4>
                  <div className="space-y-4">
                    {stoppedMedications.map(medication => {
                      const stoppedDate = medication.adherence?.stoppedAt 
                        ? new Date(medication.adherence.stoppedAt).toLocaleDateString()
                        : 'Unknown date';

                      return (
                        <div key={medication._id} className="p-4 rounded-lg border-2 bg-gray-50 border-gray-300">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <XCircle className="w-5 h-5 text-gray-600" />
                                <h4 className="font-medium text-gray-900">{medication.medicationName}</h4>
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                                  {isEnglish() ? "Stopped" : "Imeachwa"}
                                </span>
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>{isEnglish() ? "Dosage:" : "Kipimo:"}</strong> {medication.dosage}</p>
                                <p><strong>{isEnglish() ? "Frequency:" : "Mara ngapi:"}</strong> {medication.frequency}</p>
                                {medication.adherence?.reasonForStopping && (
                                  <p className="text-red-700"><strong>{isEnglish() ? "Reason for stopping:" : "Sababu ya kuacha:"}</strong> {medication.adherence.reasonForStopping}</p>
                                )}
                                <p><strong>{isEnglish() ? "Stopped on:" : "Iliyoachwa:"}</strong> {stoppedDate}</p>
                              </div>

                              {/* Show patient allergies for stopped medication */}
                              {medication.patientAllergies && medication.patientAllergies.length > 0 && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-xs font-medium text-red-600 mb-1">
                                    {isEnglish() ? "Patient Allergies:" : "Mzio wa Mgonjwa:"}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {medication.patientAllergies.map((allergy, index) => {
                                      const allergyName = typeof allergy === 'string' ? allergy : allergy.allergyName;
                                      return (
                                        <span
                                          key={index}
                                          className="text-xs px-2 py-1 bg-white text-red-700 rounded border border-red-200"
                                        >
                                          {allergyName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Show side effects for stopped medication */}
                              {medication.experiencedSideEffects && medication.experiencedSideEffects.length > 0 && (
                                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                                  <p className="text-xs font-medium text-orange-700 mb-1">
                                    {isEnglish() ? "Reported Side Effects:" : "Athari Zilizoripotiwa:"} ({medication.experiencedSideEffects.length})
                                  </p>
                                  <div className="space-y-1">
                                    {medication.experiencedSideEffects.map((effect, index) => (
                                      <div key={index} className="text-xs">
                                        <span className="font-medium">{effect.sideEffectName}</span>
                                        <span className={`ml-2 px-1 py-0.5 rounded ${getSeverityColor(effect.severity)}`}>
                                          {effect.severity}
                                        </span>
                                        {effect.notes && (
                                          <span className="ml-2 text-gray-600">- {effect.notes}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => restartTakingMedication(medication._id)}
                              className="ml-4 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-300"
                              title={isEnglish() ? "Restart this medication" : "Anzisha tena dawa hii"}
                            >
                              <PlayCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicationReminders;