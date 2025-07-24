'use client';
import React, { useState } from 'react';
import { Stethoscope, Search, Bell, MessageCircle, Download, Settings, LogOut, Calendar, Activity } from 'lucide-react';

import PatientList from './PatientList';
import { Patient } from '../../types/doctors';
import { mockPatients } from './data/mockData';

import AlertsPanel from './AlertsPanel';
import { Alert } from '../../types/doctors';

import PrescriptionPanel from './PrescriptionPanel';
import { Prescription } from '../../types/doctors';
import { mockCareNotes, mockPrescriptions } from './data/mockData';


export default function Doctors() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allAlerts, setAllAlerts] = useState<Alert[]>([
        {
            id: '1',
            type: 'emergency',
            severity: 'Critical',
            message: 'High heart rate detected for Patient A',
            timestamp: new Date().toISOString(),
            patientId: '1',
        },
        {
            id: '3',
            type: 'appointment',
            severity: 'Low',
            message: 'Schedule appointment for consultation',
            timestamp: new Date().toISOString(),
            patientId: '3',
        },
        {
            id: '2',
            type: 'vitals',
            severity: 'High',
            message: 'Low oxygen saturation for Patient B',
            timestamp: new Date().toISOString(),
            patientId: '2',
        },
    ]);

    const handleGenerateReport = () => {
        alert('Report download triggered');
    };
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>(mockPatients);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const handlePatientSelect = (patient: Patient) => {
        setSelectedPatient(patient);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                    {/* Left: Logo and Title */}
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Stethoscope className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">SmartCare Dashboard</h1>
                            <p className="text-sm text-gray-500">Doctor Portal</p>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Alerts */}
                        <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
                            <Bell className="h-5 w-5" />
                            {allAlerts.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {allAlerts.length}
                                </span>
                            )}
                        </button>

                        {/* Messages */}
                        <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                            <MessageCircle className="h-5 w-5" />
                        </button>

                        {/* Report Button */}
                        <button
                            onClick={handleGenerateReport}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download Report</span>
                        </button>

                        {/* Settings & Logout */}
                        <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                                <Settings className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Section */}
            <main className="flex-1 p-6">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Welcome back, Dr. Jane</h2>
                                <p className="text-blue-100 mb-4">You have {allAlerts.filter(a => a.severity === 'Critical').length} critical alerts and {filteredPatients.length} patients under your care.</p>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <Activity className="h-5 w-5 text-blue-200" />
                                        <span className="text-sm">Real-time monitoring active</span>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <Calendar className="h-5 w-5 text-blue-200" />
                                        <span className="text-sm">{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold">{filteredPatients.length}</div>
                                <div className="text-sm text-blue-200">Active Patients</div>
                            </div>
                        </div>
                    </div>
                </div>
                <PatientList
                    patients={filteredPatients}
                    onPatientSelect={handlePatientSelect}
                />
                {/* Alerts Panel */}
                <div className="mt-6">
                    <AlertsPanel alerts={allAlerts} />
                </div>
                <div className="mt-6">
                    <PrescriptionPanel
                        prescriptions={[]}
                        careNotes={[]}
                        selectedPatient={selectedPatient}
                        onAddPrescription={(prescription) => {
                            console.log('New prescription:', prescription);
                        }}
                        onAddCareNote={(note) => {
                            console.log('New care note:', note);
                        }}
                    />
                </div>
            </main >
        </div >
    );
}
