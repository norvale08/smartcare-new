"use client";

import React from "react";

interface EditProfileModalProps {
  editForm: any;
  onClose: () => void;
  onSave: () => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  editForm,
  onClose,
  onSave,
  onChange,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm text-gray-700">Full Name</label>
            <input
              name="fullName"
              value={editForm.fullName || ""}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">DOB</label>
              <input
                type="date"
                name="dob"
                value={editForm.dob || ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Gender</label>
              <select
                name="gender"
                value={editForm.gender || ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={editForm.weight ?? ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={editForm.height ?? ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700">Phone Number</label>
            <input
              name="phoneNumber"
              value={editForm.phoneNumber || ""}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
