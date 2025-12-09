import React, { useState, useEffect } from 'react';
import { Pill, Clock, CheckCircle, AlertCircle, Bell } from 'lucide-react';
// import { useTranslation } from "../../../lib/hypertension/useTranslation";

interface Medication {
  _id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  reminders: string[];
  status: 'active' | 'completed' | 'missed';
  lastTaken?: string;
  takenHistory?: Array<{
    takenAt: string;
    doseTime: string;
  }>;
}

const MedicationReminders: React.FC = () => {
  // const { t } = useTranslation();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        console.log("🔄 Fetching medications for patient...");

        // Use the correct endpoint from your reminders route
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/reminders/today`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("📡 Medication response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Medications data received:", data);
          setMedications(data.data || []);
        } else {
          console.error("❌ Failed to fetch medications:", response.status);
          // Fallback to other endpoints if needed
          await tryAlternativeEndpoints(token);
        }
      } catch (error) {
        console.error('Error fetching medications:', error);
        setMedications([]);
      } finally {
        setLoading(false);
      }
    };

    const tryAlternativeEndpoints = async (token: string | null) => {
      if (!token) return;
      
      const endpoints = [
        '/api/medications/patient/my-medications',
        '/api/medications/patient/active',
        '/api/medicine'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success with endpoint: ${endpoint}`, data);
            setMedications(data.medications || data.data || []);
            return;
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} failed:`, error);
        }
      }
    };

    fetchMedications();

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getNextDose = (reminders: string[]): string | null => {
    if (!reminders || reminders.length === 0) return null;
    
    const now = currentTime;
    const currentTimeStr = now.toTimeString().slice(0, 5);
    
    const futureReminders = reminders
      .filter(time => time > currentTimeStr)
      .sort();
    
    const nextDose = futureReminders[0] || reminders[0];
    return nextDose || null;
  };

  const isDueSoon = (reminderTime: string | null): boolean => {
    if (!reminderTime) return false;
    
    const now = currentTime;
    const timeParts = reminderTime.split(':');
    
    // Validate time format and ensure both parts exist
    if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) return false;
    
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    // Handle cases where parsing might fail
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return false;
    
    const reminderDate = new Date(now);
    reminderDate.setHours(hours, minutes, 0, 0);
    
    const diffMs = reminderDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    return diffMins <= 30 && diffMins >= 0; // Due in next 30 minutes
  };

  const markAsTaken = async (medicationId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No authentication token found");
        return;
      }

      console.log("📝 Marking medication as taken:", medicationId);

      // Use the correct endpoint from your backend
      const endpoint = `/api/medications/reminders/${medicationId}/mark-taken`;
      console.log("🔍 Calling endpoint:", endpoint);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Medication marked as taken successfully:", result);
        
        // Update the specific medication in state
        setMedications(prev => 
          prev.map(med => 
            med._id === medicationId 
              ? { 
                  ...med, 
                  lastTaken: new Date().toISOString(),
                  takenHistory: [
                    ...(med.takenHistory || []),
                    {
                      takenAt: new Date().toISOString(),
                      doseTime: new Date().toTimeString().slice(0, 5)
                    }
                  ]
                }
              : med
          )
        );

        // Show success feedback
        const medication = medications.find(m => m._id === medicationId);
        if (medication) {
          console.log(`✅ ${medication.medicationName} marked as taken at ${new Date().toLocaleTimeString()}`);
        }

      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error("❌ Failed to mark medication as taken:", response.status, errorData);
        
        // Show error to user
        alert(`Failed to mark medication as taken: ${errorData.message}`);
      }

    } catch (error: any) {
      console.error('❌ Error marking medication as taken:', error);
      alert('Error marking medication as taken. Please try again.');
    }
  };

  // Check if medication was taken recently (in the last 2 hours)
  const isRecentlyTaken = (medication: Medication): boolean => {
    if (!medication.lastTaken) return false;
    
    const lastTaken = new Date(medication.lastTaken);
    const now = new Date();
    const diffHours = (now.getTime() - lastTaken.getTime()) / (1000 * 60 * 60);
    
    return diffHours < 2; // Taken within last 2 hours
  };

  // Filter out medications that are completed or recently taken
  const activeMedications = medications.filter(med => 
    med.status === 'active' && !isRecentlyTaken(med)
  );

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

  if (activeMedications.length === 0) {
    const recentlyTakenCount = medications.filter(med => isRecentlyTaken(med)).length;
    
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {recentlyTakenCount > 0 
            ? 'All Caught Up!'
            : 'No Active Medications'
          }
        </h3>
        <p className="text-gray-500">
          {recentlyTakenCount > 0 
            ? `You've taken all your medications recently. Great job!`
            : 'You don\'t have any active medications at the moment.'
          }
        </p>
        {recentlyTakenCount > 0 && (
          <p className="text-sm text-green-600 mt-2">
            {recentlyTakenCount} medication(s) taken recently
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">
          Medication Reminders
        </h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {activeMedications.length} active
        </span>
      </div>

      <div className="space-y-4">
        {activeMedications.map(medication => {
          const nextDose = getNextDose(medication.reminders);
          const isDue = isDueSoon(nextDose);
          
          return (
            <div
              key={medication._id}
              className={`p-4 rounded-lg border ${
                isDue ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-gray-900">{medication.medicationName}</h4>
                    {isDue && <AlertCircle className="w-4 h-4 text-orange-500" />}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Dosage:</strong> {medication.dosage}
                    </p>
                    <p>
                      <strong>Frequency:</strong> {medication.frequency}
                    </p>
                    {medication.instructions && (
                      <p>
                        <strong>Instructions:</strong> {medication.instructions}
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Next dose: <strong>{nextDose || 'No reminders set'}</strong>
                      </span>
                      {isDue && (
                        <span className="text-orange-600 font-medium">
                          • Due soon
                        </span>
                      )}
                    </div>
                    
                    {medication.reminders && medication.reminders.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {medication.reminders.map((time, index) => (
                          <span
                            key={`${medication._id}-${time}-${index}`}
                            className={`px-2 py-1 rounded text-xs ${
                              time === nextDose && isDue
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {medication.lastTaken && (
                    <div className="mt-2 text-xs text-green-600">
                      Last taken: {new Date(medication.lastTaken).toLocaleString()}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => markAsTaken(medication._id)}
                  className="ml-4 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Mark as taken"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Debug info - remove in production */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
        <div className="font-mono">
          <div>Total medications: {medications.length}</div>
          <div>Active medications: {activeMedications.length}</div>
          <div>Current time: {currentTime.toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default MedicationReminders;