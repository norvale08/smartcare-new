"use client";

// FILE: app/caretaker/components/MedicationCard.tsx
import React from 'react';
import {
  Pill, Trash2, CheckCircle, UserX, ChevronDown, ChevronUp, User,
  AlertCircle, Thermometer, MessageSquare, Shield, Activity, XCircle,
  CheckSquare, Square, Clock3, Calendar, Clock, AlertTriangle,
  Droplets, Info, FileText, Edit
} from 'lucide-react';
import { getMedicationTiming } from '../../components/utils/medicationDates';

interface PatientInfo {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

interface DoctorInfo {
  _id: string;
  fullName: string;
  specialization?: string;
}

interface SideEffect {
  sideEffectName: string;
  reportedAt: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  intensity?: 'mild' | 'moderate' | 'severe' | 'very severe';
  resolved?: boolean;
  doctorNotes?: string;
  resolvedAt?: string;
  doctorId?: string;
  lastUpdated?: string;
}

interface Medication {
  _id?: string;
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminders: string[];
  status: 'active' | 'completed' | 'missed' | 'stopped' | 'cancelled';
  startDate: string;
  patientId: string | PatientInfo;
  prescribedBy: string | DoctorInfo;
  createdAt: string;
  lastTaken?: string;
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
  patientAllergies?: Array<{
    allergyName: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction: string;
    notes?: string;
  }>;
  potentialSideEffects?: Array<{
    name: string;
    severity: 'common' | 'uncommon' | 'rare';
    description?: string;
  }>;
  experiencedSideEffects?: SideEffect[];
  summary?: {
    totalSideEffects: number;
    severeSideEffects: number;
    unresolvedSideEffects: number;
  };
}

interface MedicationCardProps {
  medication: Medication;
  patient?: {
    id: string;
    fullName: string;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit?: (medication: Medication) => void;
  onUpdateStatus: (medicationId: string, newStatus: 'active' | 'completed' | 'stopped' | 'cancelled') => void;
  onDelete: (medicationId: string) => void;
  onOpenSideEffectModal: (sideEffect: SideEffect, medicationId: string, effectIndex: number, medicationName: string) => void;
  getPatientName: (patientId: string | PatientInfo) => string;
  formatDate: (dateString: string) => string;
}

// Helper function to get status color (Emerald/Teal/Red theme)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'completed':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'stopped':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'missed':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <Activity className="w-3 h-3 text-emerald-600" />;
    case 'stopped':
      return <UserX className="w-3 h-3 text-red-600" />;
    case 'completed':
      return <CheckCircle className="w-3 h-3 text-teal-600" />;
    case 'cancelled':
      return <XCircle className="w-3 h-3 text-gray-600" />;
    case 'missed':
      return <AlertTriangle className="w-3 h-3 text-orange-600" />;
    default:
      return <Pill className="w-3 h-3 text-emerald-600" />;
  }
};

// Helper function to get adherence icon
const getAdherenceIcon = (status: string) => {
  switch (status) {
    case 'taken':
      return <CheckSquare className="w-3 h-3 text-emerald-600" />;
    case 'missed':
      return <Square className="w-3 h-3 text-orange-600" />;
    case 'stopped':
      return <UserX className="w-3 h-3 text-red-600" />;
    default:
      return <Clock3 className="w-3 h-3 text-gray-600" />;
  }
};

// Helper function to get adherence color (Emerald/Teal/Red theme)
const getAdherenceColor = (status: string) => {
  switch (status) {
    case 'taken':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'missed':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'stopped':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Helper function to get severity color (Emerald/Teal/Red theme)
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'severe':
    case 'very severe':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'moderate':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'mild':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  patient,
  isExpanded,
  onToggleExpand,
  onEdit,
  onUpdateStatus,
  onDelete,
  onOpenSideEffectModal,
  getPatientName,
  formatDate
}) => {
  const sideEffects = medication.experiencedSideEffects || [];
  const hasSideEffects = sideEffects.length > 0;
  const hasSevereSideEffects = sideEffects.some(se =>
    se.severity === 'severe' || se.intensity === 'severe' || se.intensity === 'very severe'
  );
  const hasUnresolved = sideEffects.some(se => !se.resolved);
  const adherenceStatus = medication.adherence?.currentStatus || 'unknown';
  const patientName = getPatientName(medication.patientId);
  const timing = getMedicationTiming(medication.startDate || medication.createdAt, medication.duration);
  const showTiming = medication.status === 'active' && timing.endDate;

  return (
    <div
      className={`border rounded-lg hover:shadow-md transition-all duration-200 bg-white ${
        medication.status === 'stopped' ? 'border-red-300' :
        medication.status === 'active' ? 'border-emerald-400' :
        medication.status === 'completed' ? 'border-teal-300' :
        medication.status === 'missed' ? 'border-orange-300' :
        'border-gray-300'
      } ${isExpanded ? 'ring-1 ring-emerald-100' : ''}`}
    >
      <div className="p-4">
        {/* Compact Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate" title={medication.medicationName}>
                  {medication.medicationName}
                </h3>
                {!patient && (
                  <p className="text-xs text-gray-500 truncate mt-0.5" title={patientName}>
                    <User className="w-3 h-3 inline mr-1" />
                    {patientName}
                  </p>
                )}
              </div>
            </div>

            {/* Status Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(medication.status)} flex items-center`}>
                {getStatusIcon(medication.status)}
                <span className="ml-1">{medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}</span>
              </span>

              <div className={`px-2 py-1 rounded text-xs font-medium ${getAdherenceColor(adherenceStatus)} flex items-center`}>
                {getAdherenceIcon(adherenceStatus)}
                <span className="ml-1">{adherenceStatus}</span>
              </div>

              {medication.lastTaken && (
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-0.5" />
                  {formatDate(medication.lastTaken)}
                </span>
              )}
            </div>

            {/* Duration / End Date (active meds) */}
{showTiming && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-1 rounded">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Ends {timing.endDate ? formatDate(timing.endDate.toISOString()) : '—'}
                  </span>
                </span>
                {typeof timing.daysRemaining === 'number' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${
                    timing.isExpired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    <Clock3 className="w-3 h-3" />
                    <span>
                      {timing.isExpired ? 'Completed (time elapsed)' : `${timing.daysRemaining} day${timing.daysRemaining === 1 ? '' : 's'} left`}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Compact Action Buttons */}
          <div className="flex items-center space-x-0.5 ml-2 flex-shrink-0">
            {/* Edit Button - Show if onEdit is provided */}
            {onEdit && (
              <button
                onClick={() => onEdit(medication)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Edit prescription"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {medication.status === 'active' && (
              <>
                <button
                  onClick={() => onUpdateStatus(medication.id, 'completed')}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  title="Mark as completed"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateStatus(medication.id, 'stopped')}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Stop prescription"
                >
                  <UserX className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(medication.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete prescription"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Compact Medication Details */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="flex items-center mb-1">
                <Droplets className="w-3 h-3 text-emerald-600 mr-1" />
                <span className="text-xs font-medium text-gray-700">Dosage</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{medication.dosage}</p>
            </div>

            <div className="bg-gray-50 p-2 rounded-md">
              <div className="flex items-center mb-1">
                <Clock className="w-3 h-3 text-teal-600 mr-1" />
                <span className="text-xs font-medium text-gray-700">Frequency</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{medication.frequency}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="flex items-center mb-1">
                <Calendar className="w-3 h-3 text-emerald-600 mr-1" />
                <span className="text-xs font-medium text-gray-700">Duration</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{medication.duration}</p>
            </div>

            <div className="bg-gray-50 p-2 rounded-md">
              <div className="flex items-center mb-1">
                <Calendar className="w-3 h-3 text-teal-600 mr-1" />
                <span className="text-xs font-medium text-gray-700">Started</span>
              </div>
              <p className="text-xs text-gray-900 truncate">{formatDate(medication.startDate)}</p>
            </div>
          </div>

          {medication.instructions && (
            <div className="bg-emerald-50 p-2 rounded-md border border-emerald-100">
              <div className="flex items-center mb-1">
                <Info className="w-3 h-3 text-emerald-600 mr-1" />
                <span className="text-xs font-medium text-emerald-700">Instructions</span>
              </div>
              <p className="text-xs text-gray-700 truncate">{medication.instructions}</p>
            </div>
          )}
        </div>

        {/* Compact Side Effects Summary */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded ${hasSideEffects ? (hasSevereSideEffects ? 'bg-red-100' : 'bg-orange-100') : 'bg-emerald-50'}`}>
                <AlertCircle className={`w-3.5 h-3.5 ${hasSideEffects ? (hasSevereSideEffects ? 'text-red-600' : 'text-orange-600') : 'text-emerald-600'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">Side Effects</p>
                <p className="text-xs text-gray-500">
                  {hasSideEffects ? `${sideEffects.length} reported` : 'None'}
                  {hasUnresolved && ` • ${sideEffects.filter(se => !se.resolved).length} unresolved`}
                </p>
              </div>
            </div>
            {hasSideEffects && (
              <button
                onClick={onToggleExpand}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
              >
                {isExpanded ? 'Hide' : 'View'}
              </button>
            )}
          </div>

          {hasSideEffects && !isExpanded && (
            <div className="flex flex-wrap gap-1">
              {sideEffects.slice(0, 2).map((effect, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(effect.severity)} flex items-center`}
                  title={`${effect.sideEffectName} - ${effect.severity}`}
                >
                  {effect.sideEffectName}
                  {effect.resolved && (
                    <CheckCircle className="w-2.5 h-2.5 inline ml-0.5 text-emerald-600" />
                  )}
                </span>
              ))}
              {sideEffects.length > 2 && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +{sideEffects.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Compact Patient Allergies */}
        {medication.patientAllergies && medication.patientAllergies.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Thermometer className="w-3.5 h-3.5 text-red-600" />
              <p className="text-xs font-medium text-gray-700">Allergies</p>
              <span className="text-xs text-gray-500">({medication.patientAllergies.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {medication.patientAllergies.slice(0, 2).map((allergy, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium border border-red-200 truncate max-w-full"
                  title={`${allergy.allergyName} - ${allergy.severity}`}
                >
                  {allergy.allergyName}
                </span>
              ))}
              {medication.patientAllergies.length > 2 && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +{medication.patientAllergies.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stopped Medication Reason */}
        {medication.status === 'stopped' && medication.adherence?.reasonForStopping && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-2">
              <UserX className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-red-800">Stopped</p>
                <p className="text-xs text-red-700 truncate">{medication.adherence.reasonForStopping}</p>
                {medication.adherence.stoppedAt && (
                  <p className="text-xs text-red-600 mt-1">
                    {formatDate(medication.adherence.stoppedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-3 border-t pt-3 space-y-3">
            {/* Experienced Side Effects Details */}
            {hasSideEffects && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-900 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                    Side Effects ({sideEffects.length})
                  </h5>
                  <span className="text-xs text-gray-500">
                    {sideEffects.filter(se => se.resolved).length} resolved
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sideEffects.map((effect, index) => (
                    <div key={index} className={`p-2 rounded border ${effect.resolved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">{effect.sideEffectName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(effect.severity)} flex-shrink-0`}>
                              {effect.severity}
                            </span>
                            {effect.resolved && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium flex items-center flex-shrink-0">
                                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                                Resolved
                              </span>
                            )}
                          </div>

                          {effect.notes && (
                            <p className="text-xs text-gray-600 mb-1 truncate">
                              <span className="font-medium">Notes:</span> {effect.notes}
                            </p>
                          )}

                          {effect.doctorNotes && (
                            <div className="mb-1 p-1.5 bg-white rounded border text-xs">
                              <p className="font-medium text-emerald-700 mb-0.5">Doctor:</p>
                              <p className="text-gray-700 truncate">{effect.doctorNotes}</p>
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            {formatDate(effect.reportedAt)}
                          </p>
                        </div>

                        <button
                          onClick={() => onOpenSideEffectModal(effect, medication.id, index, medication.medicationName)}
                          className="ml-2 p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex-shrink-0"
                          title="Update side effect"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Potential Side Effects */}
            {medication.potentialSideEffects && medication.potentialSideEffects.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                  Potential Side Effects
                </h5>
                <div className="grid grid-cols-1 gap-1.5">
                  {medication.potentialSideEffects.slice(0, 3).map((effect, index) => (
                    <div key={index} className="p-2 bg-teal-50 border border-teal-200 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{effect.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${getSeverityColor(effect.severity)} flex-shrink-0`}>
                          {effect.severity}
                        </span>
                      </div>
                      {effect.description && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{effect.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationCard;
