import React from 'react';
import { Search } from 'lucide-react';

interface DoctorsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterSpecialization: string;
  setFilterSpecialization: (specialization: string) => void;
  filterCondition: string;
  setFilterCondition: (condition: string) => void;
}

const DoctorsFilters: React.FC<DoctorsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterSpecialization,
  setFilterSpecialization,
  filterCondition,
  setFilterCondition,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Doctors
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              id="search"
              placeholder="Search by name, email, phone, license, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Specialization Filter */}
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
            Specialization
          </label>
          <select
            id="specialization"
            value={filterSpecialization}
            onChange={(e) => setFilterSpecialization(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Specializations</option>
            <option value="general-practice">General Practice</option>
            <option value="endocrinology">Endocrinology</option>
            <option value="cardiology">Cardiology</option>
            <option value="nephrology">Nephrology</option>
            <option value="internal-medicine">Internal Medicine</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Condition Filter */}
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
            Condition
          </label>
          <select
            id="condition"
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Conditions</option>
            <option value="diabetes">Diabetes</option>
            <option value="hypertension">Hypertension</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DoctorsFilters;