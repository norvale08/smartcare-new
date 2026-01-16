// relative/dashboard/components/tabs/ProfileTab.tsx
import { PatientInfo } from '../../types';
import { DashboardUtils } from '../../utils';

interface ProfileTabProps {
  patientData: PatientInfo;
}

export function ProfileTab({ patientData }: ProfileTabProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg sm:text-xl font-medium text-gray-900">Patient Profile</h3>
        <p className="mt-1 text-sm sm:text-base text-gray-500">
          Complete health profile for {patientData.name}
        </p>
      </div>

      {/* Profile Details */}
      <div className="border-t border-gray-200">
        <dl className="divide-y divide-gray-200">
          {/* Full Name */}
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm sm:text-base font-medium text-gray-500">Full Name</dt>
            <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
              {patientData.name}
            </dd>
          </div>

          {/* Date of Birth */}
          {patientData.dob && (
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(patientData.dob).toLocaleDateString()} ({DashboardUtils.calculateAge(patientData.dob)} years old)
              </dd>
            </div>
          )}

          {/* Gender */}
          {patientData.gender && (
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {patientData.gender}
              </dd>
            </div>
          )}

          {/* Weight */}
          {patientData.weight && (
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Weight</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {patientData.weight} kg
              </dd>
            </div>
          )}

          {/* Height */}
          {patientData.height && (
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Height</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {patientData.height} cm
              </dd>
            </div>
          )}

          {/* Allergies */}
          {patientData.allergies && (
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Allergies</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {patientData.allergies}
              </dd>
            </div>
          )}

          {/* Surgeries */}
          {patientData.surgeries && (
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Surgeries</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {patientData.surgeries}
              </dd>
            </div>
          )}

          {/* Medical Conditions */}
          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm sm:text-base font-medium text-gray-500">Medical Conditions</dt>
            <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {patientData.diabetes && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                    Diabetes
                  </span>
                )}
                {patientData.hypertension && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium bg-orange-100 text-orange-800">
                    Hypertension
                  </span>
                )}
                {patientData.cardiovascular && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
                    Cardiovascular
                  </span>
                )}
                {!patientData.diabetes && !patientData.hypertension && !patientData.cardiovascular && (
                  <span className="text-sm sm:text-base text-gray-500">No known conditions</span>
                )}
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
