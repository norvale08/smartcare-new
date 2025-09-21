"use client"
import React, { useState, useEffect } from 'react';
import { Search, User, Stethoscope, Building, Send, X } from 'lucide-react';
import axios from 'axios';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
}

interface Hospital {
  _id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface AssignProps {
  patientId: string;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Assign({ patientId, onClose }: AssignProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchTermDoctors, setSearchTermDoctors] = useState('');
  const [searchTermHospitals, setSearchTermHospitals] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchHospitals();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
      setMessage('Failed to load doctors');
    }
  };

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/hospital`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHospitals(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch hospitals', err);
      setMessage('Failed to load hospitals');
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTermDoctors.toLowerCase())
  );

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchTermHospitals.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchTermHospitals.toLowerCase())
  );

  const handleRequestDoctor = async () => {
    if (!selectedDoctorId) {
      setMessage('Please select a doctor');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/assignment/request`, {
        patientId,
        doctorId: selectedDoctorId,
        type: 'doctor'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Request sent to doctor successfully');
      setSelectedDoctorId('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to send request to doctor');
    }
    setLoading(false);
  };

  const handleRequestHospital = async () => {
    if (!selectedHospitalId) {
      setMessage('Please select a hospital');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/assignment/request`, {
        patientId,
        hospitalId: selectedHospitalId,
        type: 'hospital'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Request sent to hospital successfully');
      setSelectedHospitalId('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to send request to hospital');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope size={28} />
            Request Providers for Patient {patientId}
          </h1>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Request */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User size={20} />
              Select Doctor to Request
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <Search size={18} />
              <input
                type="text"
                value={searchTermDoctors}
                onChange={(e) => setSearchTermDoctors(e.target.value)}
                placeholder="Search doctors by name..."
                className="flex-1 border rounded px-3 py-2"
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className={`p-3 border rounded cursor-pointer hover:bg-white flex items-center gap-3 ${
                    selectedDoctorId === doctor._id ? 'bg-blue-100 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedDoctorId(doctor._id)}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</p>
                    <p className="text-sm text-gray-500">{doctor.specialty || 'General'}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleRequestDoctor}
              disabled={loading || !selectedDoctorId}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 justify-center"
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Request to Doctor'}
            </button>
          </div>

          {/* Hospital Request */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Building size={20} />
              Select Hospital to Request
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <Search size={18} />
              <input
                type="text"
                value={searchTermHospitals}
                onChange={(e) => setSearchTermHospitals(e.target.value)}
                placeholder="Search hospitals by name or address..."
                className="flex-1 border rounded px-3 py-2"
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredHospitals.map((hospital) => (
                <div
                  key={hospital._id}
                  className={`p-3 border rounded cursor-pointer hover:bg-white flex items-center gap-3 ${
                    selectedHospitalId === hospital._id ? 'bg-blue-100 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedHospitalId(hospital._id)}
                >
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <Building className="text-white w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{hospital.name}</p>
                    <p className="text-sm text-gray-500">{hospital.address}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleRequestHospital}
              disabled={loading || !selectedHospitalId}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 justify-center"
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Request to Hospital'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
