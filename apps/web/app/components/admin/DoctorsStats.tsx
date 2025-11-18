import React from 'react';
import { Users, Activity, Heart, Filter } from 'lucide-react';
import { Doctor } from './DoctorsMangement';

interface DoctorsStatsProps {
  doctors: Doctor[];
  filteredDoctors: Doctor[];
}

const DoctorsStats: React.FC<DoctorsStatsProps> = ({ doctors, filteredDoctors }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Doctors</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{doctors.length}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Users className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Diabetes Specialists</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {doctors.filter(d => d.diabetes).length}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <Activity className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Hypertension Specialists</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {doctors.filter(d => d.hypertension).length}
            </p>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <Heart className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Showing</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredDoctors.length}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <Filter className="text-purple-600" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsStats;