// ============================================
// FILE: apps/web/app/patient/components/MedicationReminders.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { Pill, Clock, CheckCircle, AlertCircle, Bell, AlertTriangle, Info, RefreshCw, XCircle, PlayCircle, SkipForward } from 'lucide-react';
import { useTranslation } from "../../../lib/hypertension/useTranslation";

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
      status: 'taken' | 'missed' | 'stopped';
      reason?: string;
      notes?: string;
    }>;
  };
  // UPDATED: patientAllergies is now a string array, not object array
  patientAllergies: string[];
  potentialSideEffects: Array<{
    name: string;
    severity: 'common' | 'uncommon' | 'rare';
    description: string;
  }>;
  experiencedSideEffects: Array<{
    sideEffectName: string;
    reportedAt: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
    intensity?: string;
  }>;
  lastTaken?: string;
  takenHistory?: Array<{
    takenAt: string;
    doseTime: string;
  }>;
}

const MedicationReminders: React.FC = () => {
  const { t } = useTranslation();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSideEffects, setShowSideEffects] = useState<{ [key: string]: boolean }>({});
  const [selectedSideEffects, setSelectedSideEffects] = useState<{ [medicationId: string]: string[] }>({});
  const [showStopDialog, setShowStopDialog] = useState<{ [key: string]: boolean }>({});
  const [stopReasons, setStopReasons] = useState<{ [key: string]: string }>({});
  const [stopNotes, setStopNotes] = useState<{ [key: string]: string }>({});
  const [sideEffectsIntensity, setSideEffectsIntensity] = useState<{ [key: string]: string }>({});

  const isEnglish = () => (t.language ?? "en-US") === "en-US";

  useEffect(() => {
    fetchMedications();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMedications = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      
      const token = localStorage.getItem("token");

      console.log('🔍 Fetching medications...');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/today`,
        { headers: { Authorization: `Bearer ${token ?? ''}` } }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Medications received:', data.data?.length || 0);
        
        // Log each medication's details including allergies
        data.data?.forEach((med: Medication) => {
          console.log(`Medication: ${med.medicationName}`);
          console.log(`  - Status: ${med.status}`);
          console.log(`  - Adherence: ${med.adherence?.currentStatus || 'unknown'}`);
          console.log(`  - Allergies: ${med.patientAllergies?.length || 0}`);
          console.log(`  - Allergies List: ${med.patientAllergies?.join(', ') || 'None'}`);
          console.log(`  - Potential Side Effects: ${med.potentialSideEffects?.length || 0}`);
          console.log(`  - Experienced Side Effects: ${med.experiencedSideEffects?.length || 0}`);
        });

        setMedications(data.data || []);

        const initialSelected: { [key: string]: string[] } = {};
        (data.data || []).forEach((med: Medication) => {
          initialSelected[med._id] = med.experiencedSideEffects?.map(se => se.sideEffectName) || [];
        });
        setSelectedSideEffects(initialSelected);
      } else {
        console.error('❌ Failed to fetch medications:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching medications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchMedications(false);
  };

  const toggleSideEffect = async (medicationId: string, sideEffectName: string) => {
    const currentSelected = selectedSideEffects[medicationId] || [];
    const isCurrentlySelected = currentSelected.includes(sideEffectName);

    // Optimistic update
    setSelectedSideEffects(prev => ({
      ...prev,
      [medicationId]: isCurrentlySelected
        ? currentSelected.filter(name => name !== sideEffectName)
        : [...currentSelected, sideEffectName]
    }));

    try {
      const token = localStorage.getItem("token");

      if (isCurrentlySelected) {
        // Remove side effect
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/remove-side-effect`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token ?? ''}`,
            },
            body: JSON.stringify({ sideEffectName })
          }
        );

        if (!response.ok) {
          // Revert on failure
          setSelectedSideEffects(prev => ({
            ...prev,
            [medicationId]: currentSelected
          }));
          alert(isEnglish() ? 'Failed to remove side effect' : 'Imeshindikana kuondoa athari mbaya');
        } else {
          console.log('✅ Side effect removed:', sideEffectName);
        }
      } else {
        // Add side effect
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/${medicationId}/report-side-effect`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token ?? ''}`,
            },
            body: JSON.stringify({
              sideEffectName,
              severity: 'mild',
              notes: ''
            })
          }
        );

        if (!response.ok) {
          // Revert on failure
          setSelectedSideEffects(prev => ({
            ...prev,
            [medicationId]: currentSelected
          }));
          alert(isEnglish() ? 'Failed to report side effect' : 'Imeshindikana kuripoti athari mbaya');
        } else {
          console.log('✅ Side effect reported:', sideEffectName);
        }
      }
    } catch (error) {
      console.error('Error updating side effect:', error);
      // Revert on error
      setSelectedSideEffects(prev => ({
        ...prev,
        [medicationId]: currentSelected
      }));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'common': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'uncommon': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rare': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getNextDose = (reminders: string[]): string | null => {
    if (!reminders || reminders.length === 0) return null;
    const currentTimeStr = currentTime.toTimeString().slice(0, 5);
    const futureReminders = reminders.filter(time => time > currentTimeStr).sort();
    return futureReminders[0] || reminders[0] || null;
  };

  const isDueSoon = (reminderTime: string | null): boolean => {
    if (!reminderTime) return false;
    const [hoursStr, minutesStr] = reminderTime.split(':');
    const hours = parseInt(hoursStr ?? '0', 10);
    const minutes = parseInt(minutesStr ?? '0', 10);
    const reminderDate = new Date(currentTime);
    reminderDate.setHours(hours, minutes, 0, 0);
    const diffMins = Math.floor((reminderDate.getTime() - currentTime.getTime()) / 60000);
    return diffMins <= 30 && diffMins >= 0;
  };

  const markAsTaken = async (medicationId: string) => {
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
        }
      );

      if (response.ok) {
        // Refresh medications to get updated data including allergies
        fetchMedications(false);
        console.log('✅ Medication marked as taken');
      }
    } catch (error) {
      console.error('❌ Error marking medication as taken:', error);
    }
  };

  const markAsMissed = async (medicationId: string) => {
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
          body: JSON.stringify({ reason: 'Patient marked as missed' })
        }
      );

      if (response.ok) {
        // Refresh medications to get updated data including allergies
        fetchMedications(false);
        console.log('✅ Medication marked as missed');
      }
    } catch (error) {
      console.error('❌ Error marking medication as missed:', error);
    }
  };

  const stopTakingMedication = async (medicationId: string) => {
    const reason = stopReasons[medicationId];
    const notes = stopNotes[medicationId];
    const intensity = sideEffectsIntensity[medicationId];

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
            notes,
            sideEffectsIntensity: intensity
          })
        }
      );

      if (response.ok) {
        // Refresh medications to get updated data
        fetchMedications(false);
        
        // Clear dialog state
        setShowStopDialog(prev => ({ ...prev, [medicationId]: false }));
        setStopReasons(prev => ({ ...prev, [medicationId]: '' }));
        setStopNotes(prev => ({ ...prev, [medicationId]: '' }));
        setSideEffectsIntensity(prev => ({ ...prev, [medicationId]: '' }));
        
        console.log('✅ Medication marked as stopped');
        alert(isEnglish() ? 'Medication marked as stopped. Your doctor has been notified.' : 'Dawa imeandikwa kama iliyoachwa. Daktari wako ameahirishwa.');
      }
    } catch (error) {
      console.error('❌ Error stopping medication:', error);
      alert(isEnglish() ? 'Failed to stop medication' : 'Imeshindikana kuacha dawa');
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
        // Refresh medications to get updated data
        fetchMedications(false);
        console.log('✅ Medication restarted');
        alert(isEnglish() ? 'Medication restarted successfully' : 'Dawa imeanzishwa tena kwa mafanikio');
      }
    } catch (error) {
      console.error('❌ Error restarting medication:', error);
      alert(isEnglish() ? 'Failed to restart medication' : 'Imeshindikana kuanzisha dawa tena');
    }
  };

  const isRecentlyTaken = (medication: Medication): boolean => {
    if (!medication.lastTaken) return false;
    const lastTakenTime = new Date(medication.lastTaken).getTime();
    const diffHours = (Date.now() - lastTakenTime) / (1000 * 60 * 60);
    return diffHours < 2;
  };

  const activeMedications = medications.filter(med => 
    med.status === 'active' && !isRecentlyTaken(med)
  );

  const stoppedMedications = medications.filter(med => 
    med.status === 'stopped'
  );

  // UPDATED: Get unique allergies as strings instead of objects
  const allAllergies = medications
    .flatMap(med => med.patientAllergies || [])
    .filter((allergy, index, array) => array.indexOf(allergy) === index); // Get unique strings

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <div className="animate-pulse">
          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove in production */}
      {medications.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Debug:</strong> No medications found. Make sure a doctor has prescribed medications for you.
          </p>
        </div>
      )}

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

      {/* Medications */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              {isEnglish() ? "Medication Reminders" : "Kumbusho za Dawa"}
            </h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeMedications.length} {isEnglish() ? "active" : "zinatumika"}
            </span>
            {stoppedMedications.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {stoppedMedications.length} {isEnglish() ? "stopped" : "zimeachwa"}
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title={isEnglish() ? "Refresh medications" : "Onyesha upya dawa"}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isEnglish() ? "Refresh" : "Onyesha upya"}</span>
          </button>
        </div>

        {activeMedications.length === 0 && stoppedMedications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isEnglish() ? 'All Caught Up!' : 'Umeshikilia Yote!'}
            </h3>
            <p className="text-gray-500">
              {isEnglish()
                ? "You've taken all your medications recently."
                : "Umenywa dawa zako zote hivi karibuni."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Medications */}
            {activeMedications.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  {isEnglish() ? "Active Medications" : "Dawa Zinazotumika"}
                </h4>
                <div className="space-y-4">
                  {activeMedications.map(medication => {
                    const nextDose = getNextDose(medication.reminders);
                    const isDue = nextDose ? isDueSoon(nextDose) : false;
                    const showEffects = showSideEffects[medication._id];
                    const showStopModal = showStopDialog[medication._id];

                    return (
                      <div
                        key={medication._id}
                        className={`p-4 rounded-lg border ${isDue ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Pill className="w-4 h-4 text-blue-600" />
                              <h4 className="font-medium text-gray-900">{medication.medicationName}</h4>
                              {isDue && <AlertCircle className="w-4 h-4 text-orange-500" />}
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>{isEnglish() ? "Dosage:" : "Kipimo:"}</strong> {medication.dosage}</p>
                              <p><strong>{isEnglish() ? "Frequency:" : "Mara ngapi:"}</strong> {medication.frequency}</p>
                              {medication.instructions && (
                                <p><strong>{isEnglish() ? "Instructions:" : "Maelekezo:"}</strong> {medication.instructions}</p>
                              )}
                            </div>

                            {/* Show patient allergies for this specific medication */}
                            {medication.patientAllergies && medication.patientAllergies.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-red-600 mb-1">
                                  {isEnglish() ? "Patient Allergies:" : "Mzio wa Mgonjwa:"}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {medication.patientAllergies.map((allergy, index) => (
                                    <span
                                      key={index}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded border border-red-200"
                                    >
                                      {allergy}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-3">
                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">
                                  {isEnglish() ? "Next dose:" : "Kipimo kifuatacho:"} <strong>{nextDose || 'N/A'}</strong>
                                </span>
                                {isDue && (
                                  <span className="text-orange-600 font-medium">
                                    • {isEnglish() ? "Due soon" : "Inakuja hivi karibuni"}
                                  </span>
                                )}
                              </div>
                            </div>

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
                                  <div className="mt-3 space-y-2 bg-white p-3 rounded border">
                                    <p className="text-xs text-gray-600 mb-2">
                                      {isEnglish()
                                        ? "Check any side effects you're experiencing:"
                                        : "Chagua athari zozote unazopata:"}
                                    </p>
                                    {medication.potentialSideEffects.map((effect, index) => (
                                      <label
                                        key={`${medication._id}-${effect.name}-${index}`}
                                        className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={(selectedSideEffects[medication._id] || []).includes(effect.name)}
                                          onChange={() => toggleSideEffect(medication._id, effect.name)}
                                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">{effect.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(effect.severity)}`}>
                                              {effect.severity}
                                            </span>
                                          </div>
                                          {effect.description && <p className="text-xs text-gray-600 mt-1">{effect.description}</p>}
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="ml-4 flex flex-col space-y-2">
                            <button
                              onClick={() => markAsTaken(medication._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={isEnglish() ? "Mark as taken" : "Weka kama iliyonywewa"}
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => markAsMissed(medication._id)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title={isEnglish() ? "Mark as missed" : "Weka kama imepitwa"}
                            >
                              <SkipForward className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setShowStopDialog(prev => ({ ...prev, [medication._id]: true }))}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={isEnglish() ? "Stop taking this medication" : "Acha kutumia dawa hii"}
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Stop Medication Dialog */}
                        {showStopModal && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h5 className="font-medium text-red-800 mb-2">
                              {isEnglish() ? "Why are you stopping this medication?" : "Kwa nini unaacha kutumia dawa hii?"}
                            </h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-red-700 mb-1">
                                  {isEnglish() ? "Reason *" : "Sababu *"}
                                </label>
                                <select
                                  value={stopReasons[medication._id] || ''}
                                  onChange={(e) => setStopReasons(prev => ({ ...prev, [medication._id]: e.target.value }))}
                                  className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                  <option value="">{isEnglish() ? "Select a reason" : "Chagua sababu"}</option>
                                  <option value="side_effects">{isEnglish() ? "Side effects" : "Athari mbaya"}</option>
                                  <option value="feeling_better">{isEnglish() ? "Feeling better" : "Najisikia vizuri"}</option>
                                  <option value="forgot_to_take">{isEnglish() ? "Forgot to take" : "Nimesahau kunywa"}</option>
                                  <option value="too_expensive">{isEnglish() ? "Too expensive" : "Ni ghali sana"}</option>
                                  <option value="doctor_advised">{isEnglish() ? "Doctor advised" : "Daktari ameshauri"}</option>
                                  <option value="other">{isEnglish() ? "Other" : "Nyingine"}</option>
                                </select>
                              </div>

                              {stopReasons[medication._id] === 'side_effects' && (
                                <div>
                                  <label className="block text-sm font-medium text-red-700 mb-1">
                                    {isEnglish() ? "How intense are the side effects?" : "Athari mbaya ni kali kiasi gani?"}
                                  </label>
                                  <select
                                    value={sideEffectsIntensity[medication._id] || ''}
                                    onChange={(e) => setSideEffectsIntensity(prev => ({ ...prev, [medication._id]: e.target.value }))}
                                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                  >
                                    <option value="">{isEnglish() ? "Select intensity" : "Chagua ukali"}</option>
                                    <option value="mild">{isEnglish() ? "Mild - Can tolerate" : "Nyepesi - Naweza kuvumilia"}</option>
                                    <option value="moderate">{isEnglish() ? "Moderate - Uncomfortable" : "Wastani - Haifai"}</option>
                                    <option value="severe">{isEnglish() ? "Severe - Can't continue" : "Kali - Siwezi kuendelea"}</option>
                                  </select>
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium text-red-700 mb-1">
                                  {isEnglish() ? "Additional notes (optional)" : "Maelezo ya ziada (hiari)"}
                                </label>
                                <textarea
                                  value={stopNotes[medication._id] || ''}
                                  onChange={(e) => setStopNotes(prev => ({ ...prev, [medication._id]: e.target.value }))}
                                  rows={2}
                                  className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                  placeholder={isEnglish() ? "Tell us more..." : "Tuambie zaidi..."}
                                />
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setShowStopDialog(prev => ({ ...prev, [medication._id]: false }));
                                    setStopReasons(prev => ({ ...prev, [medication._id]: '' }));
                                    setStopNotes(prev => ({ ...prev, [medication._id]: '' }));
                                    setSideEffectsIntensity(prev => ({ ...prev, [medication._id]: '' }));
                                  }}
                                  className="flex-1 py-2 px-4 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                                >
                                  {isEnglish() ? "Cancel" : "Ghairi"}
                                </button>
                                <button
                                  onClick={() => stopTakingMedication(medication._id)}
                                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                  {isEnglish() ? "Confirm Stop" : "Thibitisha Kuacha"}
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
                  {isEnglish() ? "Stopped Medications" : "Dawa Zilizoachwa"}
                </h4>
                <div className="space-y-4">
                  {stoppedMedications.map(medication => {
                    const stoppedDate = medication.adherence?.stoppedAt 
                      ? new Date(medication.adherence.stoppedAt).toLocaleDateString()
                      : 'Unknown date';

                    return (
                      <div
                        key={medication._id}
                        className="p-4 rounded-lg border bg-red-50 border-red-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <h4 className="font-medium text-gray-900">{medication.medicationName}</h4>
                              <span className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded">
                                {isEnglish() ? "Stopped" : "Imeachwa"}
                              </span>
                            </div>

                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>{isEnglish() ? "Dosage:" : "Kipimo:"}</strong> {medication.dosage}</p>
                              <p><strong>{isEnglish() ? "Frequency:" : "Mara ngapi:"}</strong> {medication.frequency}</p>
                              {medication.adherence?.reasonForStopping && (
                                <p><strong>{isEnglish() ? "Reason for stopping:" : "Sababu ya kuacha:"}</strong> {medication.adherence.reasonForStopping}</p>
                              )}
                              <p><strong>{isEnglish() ? "Stopped on:" : "Iliyoachwa:"}</strong> {stoppedDate}</p>
                            </div>

                            {/* Show patient allergies for this stopped medication */}
                            {medication.patientAllergies && medication.patientAllergies.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-red-600 mb-1">
                                  {isEnglish() ? "Patient Allergies:" : "Mzio wa Mgonjwa:"}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {medication.patientAllergies.map((allergy, index) => (
                                    <span
                                      key={index}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded border border-red-200"
                                    >
                                      {allergy}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Show experienced side effects if any */}
                            {medication.experiencedSideEffects && medication.experiencedSideEffects.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-red-700 mb-1">
                                  {isEnglish() ? "Reported side effects:" : "Athari zilizoripotiwa:"}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {medication.experiencedSideEffects.map((effect, index) => (
                                    <span
                                      key={index}
                                      className={`text-xs px-2 py-1 rounded ${getSeverityColor(effect.severity)}`}
                                    >
                                      {effect.sideEffectName}
                                      {effect.intensity && ` (${effect.intensity})`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => restartTakingMedication(medication._id)}
                            className="ml-4 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationReminders;