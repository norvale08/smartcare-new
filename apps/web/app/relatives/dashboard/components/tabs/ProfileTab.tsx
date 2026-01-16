// relative/dashboard/components/tabs/ProfileTab.tsx
import { Calculator } from 'lucide-react';
import { PatientInfo } from '../../types';
import { DashboardUtils } from '../../utils';

interface ProfileTabProps {
  patientData: PatientInfo;
}

export function ProfileTab({ patientData }: ProfileTabProps) {
  // Calculate BMI if both weight and height are available
  const bmi = DashboardUtils.calculateBMI(patientData.weight, patientData.height);
  const bmiCategory = bmi ? DashboardUtils.getBMICategory(bmi) : null;

  // Helper function to get BMI badge color class
  const getBMIBadgeColor = (category: string): string => {
    switch (category) {
      case 'Underweight': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Normal': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Overweight': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Obese': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

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

          {/* BMI - Simple value and category display */}
          {bmi && bmiCategory && (
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500 flex items-center">
                <Calculator className="w-4 h-4 mr-2 text-purple-500" />
                Body Mass Index (BMI)
              </dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">                

                {/* BMI Scale Visualization */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">BMI Classification Scale</span>
                    <span className="text-xs font-medium text-gray-700">Current: {bmi} kg/m²</span>
                    <span><div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${bmiCategory.color.replace('text-', 'bg-')}`}></div>
                      <span className="text-sm font-semibold">{bmiCategory.category}</span>
                    </div></span>
                  </div>
                  
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex">
                      <div className="h-full w-1/5 bg-blue-400"></div>
                      <div className="h-full w-1/5 bg-green-500"></div>
                      <div className="h-full w-1/5 bg-yellow-500"></div>
                      <div className="h-full w-2/5 bg-red-500"></div>
                    </div>
                    {/* BMI Pointer */}
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full shadow-lg border-2 border-white"
                      style={{ 
                        left: `${Math.min(Math.max(((bmi - 15) / 30) * 100, 0), 100)}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <div className="text-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto mb-1"></div>
                      <span>Underweight<br/><span className="font-medium">&lt;18.5</span></span>
                    </div>
                    <div className="text-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
                      <span>Normal<br/><span className="font-medium">18.5-24.9</span></span>
                    </div>
                    <div className="text-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                      <span>Overweight<br/><span className="font-medium">25-29.9</span></span>
                    </div>
                    <div className="text-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
                      <span>Obese<br/><span className="font-medium">≥30</span></span>
                    </div>
                  </div>
                </div>

                {/* Health Information */}
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <h4 className="text-xs font-semibold text-blue-800 mb-2">Health Information</h4>
                  <p className="text-xs text-blue-700">
                    {bmi < 18.5 && "A BMI below 18.5 is considered underweight. This may indicate nutritional deficiencies."}
                    {bmi >= 18.5 && bmi < 25 && "A BMI between 18.5 and 24.9 is within the healthy weight range."}
                    {bmi >= 25 && bmi < 30 && "A BMI between 25 and 29.9 is considered overweight. Consider lifestyle adjustments."}
                    {bmi >= 30 && "A BMI of 30 or higher is classified as obese. Consult with healthcare professionals."}
                  </p>
                </div>
              </dd>
            </div>
          )}

          {/* BMI not available notice */}
          {(!patientData.weight || !patientData.height) && (
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500 flex items-center">
                <Calculator className="w-4 h-4 mr-2 text-gray-400" />
                Body Mass Index (BMI)
              </dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-500 sm:mt-0 sm:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* BMI Label */}
                  <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg opacity-60">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">BMI</p>
                      <p className="text-xs text-gray-500">Body Mass Index</p>
                    </div>
                  </div>

                  {/* Missing Value */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700 font-medium mb-1">Value</p>
                    <div className="text-gray-400">
                      <span className="text-lg font-medium">--</span>
                      <span className="text-sm ml-1">kg/m²</span>
                    </div>
                  </div>

                  {/* Missing Category */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700 font-medium mb-1">Category</p>
                    <div className="text-gray-400 text-sm">
                      Data unavailable
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <span className="font-medium">Note:</span> BMI calculation requires both weight and height measurements.
                    {!patientData.weight && !patientData.height 
                      ? " Both measurements are currently unavailable."
                      : !patientData.weight 
                        ? " Weight measurement is required."
                        : " Height measurement is required."
                    }
                  </p>
                </div>
              </dd>
            </div>
          )}

          {/* Allergies */}
          {patientData.allergies && (
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Allergies</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {patientData.allergies}
              </dd>
            </div>
          )}

          {/* Surgeries */}
          {patientData.surgeries && (
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm sm:text-base font-medium text-gray-500">Surgeries</dt>
              <dd className="mt-1 text-sm sm:text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {patientData.surgeries}
              </dd>
            </div>
          )}

          {/* Medical Conditions */}
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
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