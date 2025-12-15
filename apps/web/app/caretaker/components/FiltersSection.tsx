// FILE: app/caretaker/components/FiltersSection.tsx
import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface FiltersSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: 'all' | 'active' | 'stopped' | 'completed';
  setFilterStatus: (status: 'all' | 'active' | 'stopped' | 'completed') => void;
  filterSeverity: 'all' | 'mild' | 'moderate' | 'severe';
  setFilterSeverity: (severity: 'all' | 'mild' | 'moderate' | 'severe') => void;
  handleRefresh: () => void;
  refreshing: boolean;
  filteredCount: number;
  totalCount: number;
  patient?: {
    id: string;
    fullName: string;
  };
  hasActiveFilters: boolean;
}

const FiltersSection: React.FC<FiltersSectionProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterSeverity,
  setFilterSeverity,
  handleRefresh,
  refreshing,
  filteredCount,
  totalCount,
  patient,
  hasActiveFilters
}) => {
  return (
    <div className="p-6 border-b">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search medications or patients..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="stopped">Stopped</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as any)}
        >
          <option value="all">All Severity</option>
          <option value="severe">Severe</option>
          <option value="moderate">Moderate</option>
          <option value="mild">Mild</option>
        </select>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setFilterSeverity('all');
            }}
            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">
              Showing {filteredCount} of {totalCount} medications
              {patient && ` for ${patient.fullName}`}
            </p>
            {hasActiveFilters && (
              <p className="text-xs text-blue-600 mt-1">
                Active filters: 
                {searchTerm && ` Search: "${searchTerm}"`}
                {filterStatus !== 'all' && ` Status: ${filterStatus}`}
                {filterSeverity !== 'all' && ` Severity: ${filterSeverity}`}
              </p>
            )}
          </div>
          {filteredCount === 0 && totalCount > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterSeverity('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters to view all
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltersSection;