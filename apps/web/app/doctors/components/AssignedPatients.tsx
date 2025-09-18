import { Patient } from "@/types/doctor";
import { getRiskColor } from "../lib/utils";

import {
  Activity,
  Heart,
  Clock,
  Droplet,
  MapPin,
} from 'lucide-react';

interface PatientsTableProps {
  patients: Patient[];
  setSelectedPatient: (patient: Patient) => void;
}

const PatientsTable: React.FC<PatientsTableProps> = ({ patients, setSelectedPatient }) => {

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Assigned Patients</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vitals</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id}>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-500">{patient.age}y, {patient.gender}</div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.condition}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span>{patient.vitals?.heartRate ?? ''} bpm</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-3 h-3 text-blue-500" />
                      <span>{patient.vitals?.bloodPressure ?? 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplet className="w-3 h-3 text-green-500" />
                      <span>{patient.vitals?.glucose ?? 'N/A'} mg/dL</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(patient.riskLevel)}`}
                  >
                    {patient.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{patient.location}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{patient.lastUpdate}</span>
                  </div>
                  </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Care Plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PatientsTable;