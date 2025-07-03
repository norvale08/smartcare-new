import React, { useState } from 'react';
import { Patient } from './types/dashboard';
import { Heart, Thermometer, Activity, Droplets, MapPin, AlertTriangle } from 'lucide-react';

/* Component Interface */
interface PatientListProps {
    patients: Patient[];
    onPatientSelect: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onPatientSelect }) => {
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'Critical': return 'bg-red-100 border-red-500 text-red-700';
            case 'High': return 'bg-orange-100 border-orange-500 text-orange-700';
            case 'Medium': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
            case 'Low': return 'bg-green-100 border-green-500 text-green-700';
            default: return 'bg-gray-100 border-gray-500 text-gray-700';
        }
    };

    const getVitalStatus = (vital: number, type: string) => {
        if (type === 'heartRate') {
            if (vital > 100 || vital < 60) return 'text-red-600';
            if (vital > 90 || vital < 70) return 'text-orange-600';
            return 'text-green-600';
        }
        if (type === 'oxygenSaturation') {
            if (vital < 95) return 'text-red-600';
            if (vital < 97) return 'text-orange-600';
            return 'text-green-600';
        }
        if (type === 'bloodPressure') {
            if (vital > 140 || vital > 90) return 'text-red-600';
            if (vital > 130 || vital > 85) return 'text-orange-600';
            return 'text-green-600';
        }
        return 'text-gray-600';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Assigned Patients</h2>
                <span className="text-sm text-gray-500">{patients.length} patients</span>
            </div>

            <div className="space-y-4">
                {patients.map((patient) => (
                    <div
                        key={patient.id}
                        className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getRiskColor(patient.riskLevel)
                            } ${selectedPatient === patient.id ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => {
                            setSelectedPatient(patient.id);
                            onPatientSelect(patient);
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                                    <span className="text-sm text-gray-500">({patient.age}y, {patient.gender})</span>
                                    {patient.alerts.length > 0 && (
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>

                                <p className="text-sm text-gray-600 mb-3">{patient.condition}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                    <div className="flex items-center space-x-1">
                                        <Heart className={`h-4 w-4 ${getVitalStatus(patient.vitals.heartRate, 'heartRate')}`} />
                                        <span className={`text-sm font-medium ${getVitalStatus(patient.vitals.heartRate, 'heartRate')}`}>
                                            {patient.vitals.heartRate} bpm
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <Activity className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-600">
                                            {patient.vitals.bloodPressure}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <Thermometer className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm font-medium text-purple-600">
                                            {patient.vitals.temperature}°F
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <Droplets className={`h-4 w-4 ${getVitalStatus(patient.vitals.oxygenSaturation, 'oxygenSaturation')}`} />
                                        <span className={`text-sm font-medium ${getVitalStatus(patient.vitals.oxygenSaturation, 'oxygenSaturation')}`}>
                                            {patient.vitals.oxygenSaturation}%
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{patient.location.address}</span>
                                    </div>
                                    <span>Updated {patient.lastUpdate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};