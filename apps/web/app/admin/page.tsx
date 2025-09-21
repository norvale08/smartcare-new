"use client"
import {HeartPulse, PieChart, BriefcaseMedical, Hospital, UsersRound, Pill,ClipboardCheck,TrendingUp,Settings, Bell, Plus, Edit, Trash2, User, Building, X} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: number;
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

export default function Admin(){
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [showHospitalModal, setShowHospitalModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        }
    };

    const handleRegisterDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData(e.currentTarget);
            const data = {
                firstName: String(formData.get('firstName') || ''),
                lastName: String(formData.get('lastName') || ''),
                email: String(formData.get('email') || ''),
                phoneNumber: parseInt(String(formData.get('phoneNumber') || '0')),
                password: String(formData.get('password') || ''),
                specialty: String(formData.get('specialty') || '')
            };
            const res = await axios.post(`${API_URL}/api/doctor/register`, data, {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                }
            });
            console.log('Doctor registration response:', res.data);
            setMessage('Doctor registered successfully');
            setShowDoctorModal(false);
            (e.target as HTMLFormElement).reset();
            fetchDoctors();
        } catch (err: any) {
            console.error('Doctor registration error:', err.response?.data || err);
            setMessage(err.response?.data?.message || 'Failed to register doctor');
        }
        setLoading(false);
    };

    const handleRegisterHospital = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData(e.currentTarget);
            const data = {
                name: String(formData.get('name') || ''),
                address: String(formData.get('address') || ''),
                phoneNumber: String(formData.get('phoneNumber') || ''),
                email: String(formData.get('email') || ''),
                location: {
                    lat: parseFloat(String(formData.get('lat') || '0')),
                    lng: parseFloat(String(formData.get('lng') || '0'))
                }
            };
            const res = await axios.post(`${API_URL}/api/hospital`, data, {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                }
            });
            console.log('Hospital registration response:', res.data);
            setMessage('Hospital registered successfully');
            setShowHospitalModal(false);
            (e.target as HTMLFormElement).reset();
            fetchHospitals();
        } catch (err: any) {
            console.error('Hospital registration error:', err.response?.data || err);
            setMessage(err.response?.data?.message || 'Failed to register hospital');
        }
        setLoading(false);
    };

    return(
        <div className="min-h-screen bg-gray-100 flex flex-row ">
           {/* Leftside */}
           <div className="shadow-lg bg-white px-2 py-2 w-[250px] h-screen flex content-center flex-col">
                <div className='flex items-center justify-center text-center p-5 gap-1'> 
                    <HeartPulse color="#21a136" size={24} />
                    <div>
                        <h1 className="font-semibold">HealthAdmin</h1>
                        <h2 className="text-sm text-gray-600">Dashboard</h2>
                    </div>
                </div>
                <hr className='bg-gray-200 mb-2'></hr>
                    
                <ul className="space-y-1">
                    <div className='flex flex-row gap-2 p-4 cursor-pointer  hover:bg-emerald-100 rounded-md'>
                        <PieChart color="#171717" size={20}  />
                        <li className="font-medium">Overview</li>
                    </div>
                    <div className='flex flex-row gap-2 p-4 cursor-pointer hover:bg-emerald-100 rounded-md'>
                        <BriefcaseMedical color="#171717" size={20}  />
                        <li>Doctors</li>
                    </div>
                    <div className='flex flex-row gap-2 p-4 cursor-pointer hover:bg-emerald-100 rounded-md'>
                        <Hospital color="#171717" size={20}  />
                        <li>Hospitals</li>
                    </div>
                     <div className='flex flex-row gap-2 p-4 cursor-pointer hover:bg-emerald-100 rounded-md'>
                        <UsersRound color="#171717" size={20}  />
                        <li>Patients</li>
                    </div>
                     <div className='flex flex-row gap-2 p-4 cursor-pointer hover:bg-emerald-100 rounded-md'>
                        <Pill color="#171717" size={20}  />
                        <li>Medications</li>
                    </div>
                     <div className='flex flex-row gap-2 p-4 cursor-pointer hover:bg-emerald-100 rounded-md'>
                        <ClipboardCheck color="#171717" size={20}  />
                        <li>Appointments</li>
                    </div>
                     <div className='flex flex-row gap-2 p-4 cursor-pointer hover:bg-emerald-100 rounded-md'>
                        <TrendingUp color="#171717" size={20}  />
                        <li>Analytics</li>
                    </div>
                     <div className='flex flex-row gap-2 p-4 cursor-pointer hover:bg-emerald-100 rounded-md'>
                        <Settings color="#171717" size={20}  />
                        <li>Settings</li>
                    </div>
                </ul>
           </div>

           {/* Right side */}
           <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className='bg-white shadow-sm w-full flex flex-row justify-between items-center p-4'>
                    <div>
                        <h1 className="text-xl font-semibold">Dashboard Overview</h1>
                        <p className="text-gray-600">Manage healthcare providers and patients</p>
                    </div>
                    
                    <div className='flex items-center gap-4'>
                        <Bell color='#6b7280' size={20} />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <User color="white" size={18} />
                            </div>
                            <div>
                                <p className="font-medium">Sarah Johnson</p>
                                <p className="text-sm text-gray-500">Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className='flex flex-row mt-6 gap-4 px-4'>
                    <div className='bg-white shadow-sm flex justify-between h-[100px] w-[250px] p-4 items-center rounded-lg'>
                        <div className='flex flex-col'>
                            <p className="text-gray-600">Total Doctors</p>
                            <h1 className='text-2xl font-bold'>{doctors.length}</h1>
                            <p className='text-emerald-500 text-sm'>+12 this month</p>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-lg">
                            <BriefcaseMedical color='#10b981' size={22} />
                        </div>
                    </div>

                    <div className='bg-white shadow-sm flex justify-between h-[100px] w-[250px] p-4 items-center rounded-lg'>
                        <div className='flex flex-col'>
                            <p className="text-gray-600">Hospitals</p>
                            <h1 className='text-2xl font-bold'>{hospitals.length}</h1>
                            <p className='text-emerald-500 text-sm'>+3 this month</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Hospital color='#3b82f6' size={22} />
                        </div>
                    </div>

                    <div className='bg-white shadow-sm flex justify-between h-[100px] w-[250px] p-4 items-center rounded-lg'>
                        <div className='flex flex-col'>
                            <p className="text-gray-600">Active Patients</p>
                            <h1 className='text-2xl font-bold'>1,847</h1>
                            <p className='text-emerald-500 text-sm'>+156 this month</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <UsersRound color='#8b5cf6' size={22} />
                        </div>
                    </div>

                    <div className='bg-white shadow-sm flex justify-between h-[100px] w-[280px] p-4 items-center rounded-lg'>
                        <div className='flex flex-col'>
                            <p className="text-gray-600">Chronic Conditions</p>
                            <h1 className='text-2xl font-bold'>892</h1>
                            <p className='text-orange-500 text-sm'>Hypertension & Diabetes</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                            <Pill color='#f97316' size={22} />
                        </div>
                    </div>
                </div>

                {/* Management Sections */}
                <div className="flex flex-row gap-4 px-4 mt-6">
                    {/* Doctor Management */}
                    <div className="bg-white shadow-sm rounded-lg p-4 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Doctor Management</h2>
                            <button onClick={() => setShowDoctorModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <Plus size={16} />
                                Add Doctor
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {doctors.map((doctor) => (
                                <div key={doctor._id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                            <User color="white" size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</p>
                                            <p className="text-sm text-gray-500">{doctor.specialty || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Edit size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                                        <Trash2 size={16} className="text-gray-400 hover:text-red-500 cursor-pointer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hospital Management */}
                    <div className="bg-white shadow-sm rounded-lg p-4 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Hospital Management</h2>
                            <button onClick={() => setShowHospitalModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <Plus size={16} />
                                Add Hospital
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {hospitals.map((hospital) => (
                                <div key={hospital._id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <Building color="white" size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium">{hospital.name}</p>
                                            <p className="text-sm text-gray-500">{hospital.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Edit size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                                        <Trash2 size={16} className="text-gray-400 hover:text-red-500 cursor-pointer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Patient Management Table */}
                <div className="bg-white shadow-sm rounded-lg p-4 mx-4 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Patient Management</h2>
                        <div className="flex gap-3">
                            <select className="border rounded-lg px-3 py-2">
                                <option>All Conditions</option>
                                <option>Hypertension</option>
                                <option>Diabetes</option>
                            </select>
                            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <Plus size={16} />
                                Add Patient
                            </button>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-gray-600 text-sm">
                        <div>Patient</div>
                        <div>Condition</div>
                        <div>Doctor</div>
                        <div>Last Visit</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-2 mt-2">
                        <div className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                                    <User color="white" size={14} />
                                </div>
                                <div>
                                    <p className="font-medium">John Smith</p>
                                    <p className="text-xs text-gray-500">ID: PAT001</p>
                                </div>
                            </div>
                            <div>
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Hypertension</span>
                            </div>
                            <div>Dr. Michael Chen</div>
                            <div className="text-sm">2024-01-15</div>
                            <div>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Stable</span>
                            </div>
                            <div className="flex gap-2">
                                <Edit size={14} className="text-emerald-500 cursor-pointer" />
                                <Trash2 size={14} className="text-red-500 cursor-pointer" />
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                                    <User color="white" size={14} />
                                </div>
                                <div>
                                    <p className="font-medium">Maria Garcia</p>
                                    <p className="text-xs text-gray-500">ID: PAT002</p>
                                </div>
                            </div>
                            <div>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Diabetes</span>
                            </div>
                            <div>Dr. Emily Rodriguez</div>
                            <div className="text-sm">2024-01-12</div>
                            <div>
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Monitoring</span>
                            </div>
                            <div className="flex gap-2">
                                <Edit size={14} className="text-emerald-500 cursor-pointer" />
                                <Trash2 size={14} className="text-red-500 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Doctor Modal */}
                {showDoctorModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Add Doctor</h3>
                                <button onClick={() => setShowDoctorModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleRegisterDoctor}>
                                <div className="space-y-4">
                                    <input name="firstName" placeholder="First Name" className="w-full border rounded px-3 py-2" required />
                                    <input name="lastName" placeholder="Last Name" className="w-full border rounded px-3 py-2" required />
                                    <input name="email" type="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
                                    <input name="phoneNumber" placeholder="Phone Number" className="w-full border rounded px-3 py-2" required />
                                    <input name="password" type="password" placeholder="Password" className="w-full border rounded px-3 py-2" required />
                                    <input name="specialty" placeholder="Specialty" className="w-full border rounded px-3 py-2" />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowDoctorModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                                    <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-500 text-white rounded disabled:opacity-50">
                                        {loading ? 'Adding...' : 'Add Doctor'}
                                    </button>
                                </div>
                            </form>
                            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
                        </div>
                    </div>
                )}

                {/* Hospital Modal */}
                {showHospitalModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Add Hospital</h3>
                                <button onClick={() => setShowHospitalModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleRegisterHospital}>
                                <div className="space-y-4">
                                    <input name="name" placeholder="Hospital Name" className="w-full border rounded px-3 py-2" required />
                                    <input name="address" placeholder="Address" className="w-full border rounded px-3 py-2" required />
                                    <input name="phoneNumber" placeholder="Phone Number" className="w-full border rounded px-3 py-2" required />
                                    <input name="email" type="email" placeholder="Email" className="w-full border rounded px-3 py-2" required />
                                    <input name="lat" type="number" placeholder="Latitude" className="w-full border rounded px-3 py-2" />
                                    <input name="lng" type="number" placeholder="Longitude" className="w-full border rounded px-3 py-2" />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowHospitalModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                                    <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-500 text-white rounded disabled:opacity-50">
                                        {loading ? 'Adding...' : 'Add Hospital'}
                                    </button>
                                </div>
                            </form>
                            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
                        </div>
                    </div>
                )}
           </div>
        </div>
    )
}
