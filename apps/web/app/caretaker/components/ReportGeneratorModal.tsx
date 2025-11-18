// app/caretaker/components/ReportGeneratorModal.tsx
import React, { useState } from 'react';
import { X, Download, FileText, Calendar } from 'lucide-react';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onGenerate: (reportConfig: any) => Promise<void>;
}

const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  patient,
  onGenerate
}) => {
  const [reportConfig, setReportConfig] = useState({
    type: 'comprehensive',
    format: 'pdf',
    dateRange: 'last-30-days',
    includeVitals: true,
    includeMedications: true,
    includeAppointments: true,
    customStartDate: '',
    customEndDate: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);

    try {
      await onGenerate(reportConfig);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setReportConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user makes changes
    if (error) setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Generate Report</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type *
            </label>
            <select
              name="type"
              value={reportConfig.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              disabled={isGenerating}
            >
              <option value="comprehensive">Comprehensive Health Report</option>
              <option value="vitals">Vitals Summary</option>
              <option value="medications">Medication History</option>
              <option value="progress">Progress Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format *
            </label>
            <select
              name="format"
              value={reportConfig.format}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              disabled={isGenerating}
            >
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV Data</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range *
            </label>
            <select
              name="dateRange"
              value={reportConfig.dateRange}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              disabled={isGenerating}
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {reportConfig.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="customStartDate"
                  value={reportConfig.customStartDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isGenerating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="customEndDate"
                  value={reportConfig.customEndDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isGenerating}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Sections
            </label>
            
            <div className="space-y-2">
              {[
                { key: 'includeVitals', label: 'Vital Signs Data' },
                { key: 'includeMedications', label: 'Medication History' },
                { key: 'includeAppointments', label: 'Appointment History' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    name={key}
                    checked={reportConfig[key as keyof typeof reportConfig] as boolean}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    disabled={isGenerating}
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportGeneratorModal;