// FILE: app/caretaker/components/DoctorMedicationManagement/components/NoMatchingResults.tsx

import React from 'react';

interface NoMatchingResultsProps {
  totalCount: number;
  onClearFilters: () => void;
}

const NoMatchingResults: React.FC<NoMatchingResultsProps> = ({
  totalCount,
  onClearFilters
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 text-gray-300 mx-auto mb-4 flex items-center justify-center">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
          />
        </svg>
      </div>
      <h4 className="text-xl font-medium text-gray-900 mb-2">No Matching Medications</h4>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {totalCount} medications found but none match your current filters.
        Try adjusting your search or filter criteria.
      </p>
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default NoMatchingResults;