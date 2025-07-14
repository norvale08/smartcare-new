"use client";
import React from "react";
import { useFormContext } from "react-hook-form";

const ReviewStep = () => {
  const { getValues } = useFormContext();
  const data = getValues();

  
  

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Step 5: Review Your Information</h2>
        <p className="text-gray-600 mt-2">
          Please review your details carefully before submitting your profile.
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            🧍 Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-gray-600">Full Name:</span>
              <p className="font-medium">{data.fullName || "Not provided"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Date of Birth:</span>
              <p className="font-medium">{(data.dob)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Gender:</span>
              <p className="font-medium">{(data.gender?.replace('-', ' '))}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Weight:</span>
              <p className="font-medium">{data.weight ? `${data.weight} kg` : "Not provided"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Height:</span>
              <p className="font-medium">{data.height ? `${data.height} cm` : "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            📞 Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-gray-600">First Name:</span>
              <p className="font-medium">{data.firstname || "Not provided"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Last Name:</span>
              <p className="font-medium">{data.lastname || "Not provided"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Phone Number:</span>
              <p className="font-medium">{data.phoneNumber || "Not provided"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Relationship:</span>
              <p className="font-medium">{(data.relationship)}</p>
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            🩺 Medical Conditions
          </h3>
          <div className="space-y-2">
            {data.diabetes && (
              <div className="flex items-center text-green-700">
                <span className="mr-2">✅</span>
                <span>Diabetes</span>
              </div>
            )}
            {data.hypertension && (
              <div className="flex items-center text-green-700">
                <span className="mr-2">✅</span>
                <span>Hypertension</span>
              </div>
            )}
            {data.cardiovascular && (
              <div className="flex items-center text-green-700">
                <span className="mr-2">✅</span>
                <span>Cardiovascular Disease</span>
              </div>
            )}
            {!data.diabetes && !data.hypertension && !data.cardiovascular && (
              <p className="text-gray-500 italic">No conditions selected</p>
            )}
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            📋 Medical History
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Allergies:</span>
              <p className="font-medium mt-1">
                {data.allergies ? data.allergies : "None reported"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Previous Surgeries:</span>
              <p className="font-medium mt-1">
                {data.surgeries ? data.surgeries : "None reported"}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Picture */}
        {data.picture && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              📸 Profile Picture
            </h3>
            <div className="flex items-center space-x-3">
              <img 
                src={data.picture} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
              <span className="text-sm text-green-600">✅ Picture uploaded</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">📊 Profile Completeness</h4>
        <div className="text-sm text-blue-800">
          <p>• Basic information: ✅ Complete</p>
          <p>• Emergency contact: ✅ Complete</p>
          <p>• Medical conditions: {(data.diabetes || data.hypertension || data.cardiovascular) ? '✅ Specified' : '⚠️ None selected'}</p>
          <p>• Medical history: {(data.allergies || data.surgeries) ? '✅ Provided' : '⚠️ None provided'}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;