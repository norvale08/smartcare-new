// relative/dashboard/components/tabs/MedicationsTab.tsx
import { Pill } from 'lucide-react';
import { Medication, PatientInfo } from '../../types';
import { DashboardUtils } from '../../utils';

interface MedicationsTabProps {
  medications: Medication[];
  patientData: PatientInfo | null;
  onMarkAsTaken: (medicationId: string) => void;
}

export function MedicationsTab({ medications, patientData, onMarkAsTaken }: MedicationsTabProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Medication Tracker</h3>
            <p className="mt-1 text-sm text-gray-500">
              Current medications for {patientData?.name || 'patient'}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {medications.length} medication{medications.length !== 1 ? 's' : ''} total
          </div>
        </div>
      </div>

      {medications.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {medications.map((med) => (
            <div key={med.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{med.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${med.type === 'diabetes' ? 'bg-green-100 text-green-700' :
                      med.type === 'hypertension' ? 'bg-orange-100 text-orange-700' :
                        med.type === 'cardiovascular' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                      }`}>
                      {med.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Dosage</p>
                      <p className="text-sm font-medium text-gray-900">{med.dosage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Frequency</p>
                      <p className="text-sm font-medium text-gray-900">{med.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Next Dose</p>
                      <p className="text-sm font-medium text-gray-900">
                        {med.nextDose ? DashboardUtils.formatTimeUntil(med.nextDose) : 'Not scheduled'}
                      </p>
                    </div>
                  </div>

                  {med.lastTaken && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Last Taken</p>
                      <p className="text-sm text-gray-900">{DashboardUtils.formatDate(med.lastTaken)}</p>
                    </div>
                  )}

                  {med.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="text-sm text-gray-900">{med.notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => onMarkAsTaken(med.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Mark as Taken
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Pill className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No medications recorded</p>
          <p className="text-sm text-gray-400 mt-1">
            Medications will appear here when added to the patient's profile
          </p>
        </div>
      )}
    </div>
  );
}