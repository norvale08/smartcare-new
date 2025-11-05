// app/caretaker/components/QuickActions.tsx
import React from 'react';
import { 
  FileText, 
  Pill, 
  Calendar, 
  Download,
  Plus,
  Eye,
  Settings
} from 'lucide-react';
import { Patient } from '../types';

interface QuickActionsProps {
  patient: Patient;
}

const QuickActions: React.FC<QuickActionsProps> = ({ patient }) => {
  const actions = [
    {
      icon: FileText,
      label: 'View Full History',
      description: 'Complete medical records',
      onClick: () => console.log('View history for:', patient.id),
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    },
    {
      icon: Pill,
      label: 'Prescribe Medication',
      description: 'Add new prescription',
      onClick: () => console.log('Prescribe for:', patient.id),
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      icon: Calendar,
      label: 'Schedule Follow-up',
      description: 'Book next appointment',
      onClick: () => console.log('Schedule for:', patient.id),
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    },
    {
      icon: Download,
      label: 'Generate Report',
      description: 'Export patient data',
      onClick: () => console.log('Generate report for:', patient.id),
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100'
    },
    {
      icon: Plus,
      label: 'Add Vitals Manually',
      description: 'Record new measurements',
      onClick: () => console.log('Add vitals for:', patient.id),
      color: 'text-red-600 bg-red-50 hover:bg-red-100'
    },
    {
      icon: Eye,
      label: 'View Treatment Plan',
      description: 'Current care plan',
      onClick: () => console.log('View plan for:', patient.id),
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${action.color} border-transparent`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm text-gray-900">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Condition-specific quick tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <h4 className="text-xs font-medium text-gray-700 mb-2">
          Quick Tips for {patient.condition}
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          {patient.condition === 'hypertension' && (
            <>
              <p>• Check salt intake and medication adherence</p>
              <p>• Review stress levels and physical activity</p>
              <p>• Monitor for symptoms like headaches or dizziness</p>
            </>
          )}
          {patient.condition === 'diabetes' && (
            <>
              <p>• Review glucose monitoring frequency</p>
              <p>• Check for foot complications</p>
              <p>• Assess diet and exercise routine</p>
            </>
          )}
          {patient.condition === 'both' && (
            <>
              <p>• Monitor both BP and glucose closely</p>
              <p>• Check medication interactions</p>
              <p>• Review comprehensive lifestyle factors</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;