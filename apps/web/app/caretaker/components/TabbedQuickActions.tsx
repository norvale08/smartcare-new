"use client";

import React from 'react';
import { 
  MessageSquare, Phone, Pill, Calendar, Activity, 
  Bell, User, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { Patient } from '../types';

interface TabbedQuickActionsProps {
  patient: Patient;
  onOpenMessaging: () => void;
  onPrescribeMedication: () => void;
}

const TabbedQuickActions: React.FC<TabbedQuickActionsProps> = ({ 
  patient, 
  onOpenMessaging, 
  onPrescribeMedication 
}) => {
  // Quick action cards data
  const quickActions = [
    {
      id: 'message',
      title: 'Send Message',
      description: 'Quick message to patient',
      icon: MessageSquare,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      action: onOpenMessaging
    },
    {
      id: 'prescribe',
      title: 'Prescribe Medication',
      description: 'Create new prescription',
      icon: Pill,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      action: onPrescribeMedication
    },
    {
      id: 'appointment',
      title: 'Schedule Appointment',
      description: 'Set up appointment',
      icon: Calendar,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      action: () => alert('Appointment scheduling coming soon!')
    },
    {
      id: 'vitals',
      title: 'Check Vitals',
      description: 'Review latest vitals',
      icon: Activity,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      action: () => alert('Vitals review coming soon!')
    },
    {
      id: 'alerts',
      title: 'View Alerts',
      description: 'Patient health alerts',
      icon: Bell,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      action: () => alert('Alerts view coming soon!')
    },
    {
      id: 'profile',
      title: 'Full Profile',
      description: 'Complete patient profile',
      icon: User,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      action: () => alert('Full profile view coming soon!')
    }
  ];

  // Health status indicators
  const getStatusBadge = () => {
    switch (patient.status) {
      case 'stable':
        return {
          icon: CheckCircle,
          text: 'Stable',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          text: 'Needs Attention',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'critical':
        return {
          icon: AlertCircle,
          text: 'Critical',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Patient Status Bar */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${statusBadge.bgColor} ${statusBadge.borderColor} border`}>
            <statusBadge.icon className={`w-5 h-5 ${statusBadge.textColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Health Status</h3>
            <p className={`text-sm font-medium ${statusBadge.textColor}`}>
              {statusBadge.text}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last Visit</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(patient.lastVisit).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-105 ${action.bgColor} ${action.borderColor} border`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-full ${action.bgColor} ${action.borderColor} border`}>
                  <action.icon className={`w-5 h-5 ${action.textColor}`} />
                </div>
                <div className="text-center">
                  <h4 className={`font-medium ${action.textColor}`}>{action.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Patient Info Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Patient Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Age</p>
            <p className="font-medium text-gray-900">{patient.age} years</p>
          </div>
          <div>
            <p className="text-gray-500">Gender</p>
            <p className="font-medium text-gray-900">{patient.gender}</p>
          </div>
          <div>
            <p className="text-gray-500">Condition</p>
            <p className="font-medium text-gray-900 capitalize">{patient.condition}</p>
          </div>
          {patient.email && (
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900 text-sm">{patient.email}</p>
            </div>
          )}
          {patient.phoneNumber && (
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900 text-sm">{patient.phoneNumber}</p>
            </div>
          )}
        </div>
        
        {/* Allergies Section */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Known Allergies ({patient.allergies.length})</h4>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  {allergy.allergyName}
                  {allergy.severity && ` (${allergy.severity})`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabbedQuickActions;