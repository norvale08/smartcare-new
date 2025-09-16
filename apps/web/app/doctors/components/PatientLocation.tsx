import { Patient } from "@/types/doctor";
import { getRiskColor } from "../lib/utils";
import { MapPin } from "lucide-react";

interface PatientLocationsProps {
  patients: Patient[];
}

const PatientLocations: React.FC<PatientLocationsProps> = ({ patients }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Patient Locations</h2>
      </div>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Map integration goes here</p>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {patients.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">{patient.name}</div>
                  <div className="text-xs text-gray-500">{patient.location}</div>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(patient.riskLevel)}`}>
                {patient.riskLevel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientLocations;