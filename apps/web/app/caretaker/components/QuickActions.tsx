// app/caretaker/components/QuickActions.tsx
import React, { useState } from 'react';
import { 
  FileText, 
  Pill, 
  Calendar, 
  Download,
  Plus,
  Eye,
  Settings,
  History,
  Stethoscope,
  FileText as ReportIcon,
  ClipboardList
} from 'lucide-react';
import MedicationPrescriptionModal from './MedicationPrescriptionModal';
import PatientHistoryModal from './PatientHistoryModal';
import AppointmentSchedulerModal from './AppointmentSchedulerModal';
import ReportGeneratorModal from './ReportGeneratorModal';
import VitalsInputModal from './VitalsInputModal';
import TreatmentPlanModal from './TreatmentPlanModal';

interface Patient {
  id: string;
  fullName: string;
  condition: "hypertension" | "diabetes" | "both";
}

interface QuickActionsProps {
  patient: Patient;
}

const QuickActions: React.FC<QuickActionsProps> = ({ patient }) => {
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState(false);

  const handlePrescribeMedication = async (prescription: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/prescribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prescription),
      });

      if (!response.ok) {
        throw new Error('Failed to prescribe medication');
      }

      const result = await response.json();
      console.log('Medication prescribed successfully:', result);
      
      alert(`Medication prescribed successfully for ${patient.fullName}`);
      
    } catch (error) {
      console.error('Error prescribing medication:', error);
      alert('Failed to prescribe medication. Please try again.');
    }
  };

 // In your QuickActions component, update the handleGenerateReport function:
const handleGenerateReport = async (reportConfig: any) => {
  try {
    console.log('📊 Starting report generation...');
    
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    console.log('📊 Generating report with config:', reportConfig);
    console.log('🌐 API URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/generate`);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient.id,
          ...reportConfig
        }),
      }
    );

    console.log('📡 Response status:', response.status);
    console.log('📡 Response OK:', response.ok);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    // Check content type to determine how to handle the response
    const contentType = response.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      console.error('❌ Report generation failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Handle different response types based on content type
    if (contentType && contentType.includes('text/csv')) {
      // For CSV, we get the file directly
      console.log('📄 Handling CSV response');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-report-${patient.fullName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('CSV report downloaded successfully!');
      setShowReportModal(false);
      
    } else if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))) {
      // For PDF and Excel files
      console.log('📄 Handling file download response');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Determine file extension based on format
      const extension = reportConfig.format === 'pdf' ? 'pdf' : 'xlsx';
      a.href = url;
      a.download = `patient-report-${patient.fullName}-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert(`${reportConfig.format.toUpperCase()} report downloaded successfully!`);
      setShowReportModal(false);
      
    } else {
      // For JSON responses (fallback)
      console.log('📄 Handling JSON response');
      const result = await response.json();
      console.log('✅ Report generated successfully:', result);
      
      if (result.success) {
        alert(`Report generated successfully! ${result.message}`);
        
        // Show report data in console for debugging
        console.log('📋 Full report data:', result.data);
        
        // If there's a download URL, trigger download
        if (result.downloadUrl) {
          console.log('🔗 Download URL available:', result.downloadUrl);
          // You could trigger download here if needed
        }
        
        setShowReportModal(false);
      } else {
        throw new Error(result.message || 'Report generation failed');
      }
    }

  } catch (error: any) {
    console.error('❌ Error generating report:', error);
    
    // More specific error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the server is running.');
    } else if (error.message.includes('404')) {
      throw new Error('Report API endpoint not found. Please check server routes.');
    } else if (error.message.includes('401')) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to generate report. Please try again.');
    }
  }
};
  // Remove the old handleScheduleAppointment function since it's now handled in the modal

  const handleAddVitals = async (vitalsData: any) => {
    try {
      const token = localStorage.getItem("token");
      
      // Determine which endpoint to use based on patient condition
      const endpoint = patient.condition === 'diabetes' 
        ? '/api/diabetesVitals'
        : '/api/hypertensionVitals';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...vitalsData,
          patientId: patient.id
        }),
      });

      if (response.ok) {
        alert('Vitals recorded successfully!');
        setShowVitalsModal(false);
      } else {
        throw new Error('Failed to record vitals');
      }
    } catch (error) {
      console.error('Error recording vitals:', error);
      alert('Failed to record vitals. Please try again.');
    }
  };

  // Optional: Success callback for appointment scheduling
  const handleAppointmentSuccess = () => {
    console.log('Appointment scheduled successfully for:', patient.fullName);
    // You can add any additional logic here, like refreshing data or showing a toast
  };

  const actions = [
    {
      icon: History,
      label: 'View Full History',
      description: 'Complete medical records',
      onClick: () => setShowHistoryModal(true),
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    },
    {
      icon: Pill,
      label: 'Prescribe Medication',
      description: 'Add new prescription',
      onClick: () => setShowPrescriptionModal(true),
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      icon: Calendar,
      label: 'Schedule Follow-up',
      description: 'Book next appointment',
      onClick: () => setShowAppointmentModal(true),
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    },
    {
      icon: ReportIcon,
      label: 'Generate Report',
      description: 'Export patient data',
      onClick: () => setShowReportModal(true),
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100'
    },
    // {
    //   icon: Plus,
    //   label: 'Add Vitals Manually',
    //   description: 'Record new measurements',
    //   onClick: () => setShowVitalsModal(true),
    //   color: 'text-red-600 bg-red-50 hover:bg-red-100'
    // },
    {
      icon: ClipboardList,
      label: 'View Treatment Plan',
      description: 'Current care plan',
      onClick: () => setShowTreatmentPlanModal(true),
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
    }
  ];

  return (
    <>
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

      {/* Modals */}
      <MedicationPrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        patient={patient}
        onPrescribe={handlePrescribeMedication}
      />

      <PatientHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        patient={patient}
      />

      {/* Updated AppointmentSchedulerModal without onSchedule prop */}
      <AppointmentSchedulerModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        patient={patient}
        onScheduleSuccess={handleAppointmentSuccess} // Optional success callback
      />

      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        patient={patient}
        onGenerate={handleGenerateReport}
      />

      <VitalsInputModal
        isOpen={showVitalsModal}
        onClose={() => setShowVitalsModal(false)}
        patient={patient}
        onSave={handleAddVitals}
      />

      <TreatmentPlanModal
        isOpen={showTreatmentPlanModal}
        onClose={() => setShowTreatmentPlanModal(false)}
        patient={patient}
      />
    </>
  );
};

export default QuickActions;