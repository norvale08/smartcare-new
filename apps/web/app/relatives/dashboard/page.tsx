'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  condition: string;
  dob: string;
  gender: string;
  diabetes: boolean;
  hypertension: boolean;
  allergies: string;
  surgeries: string;
  picture: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  accessLevel: string;
  relationship: string;
  monitoredPatient?: PatientInfo;
  monitoredPatientProfile?: string;
}

interface VitalRecord {
  id: string;
  type: 'hypertension' | 'diabetes';
  source: string;
  timestamp: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  context?: string;
  exerciseRecent?: boolean;
  exerciseIntensity?: string;
}

interface HealthSummary {
  condition: string;
  hasData: boolean;
  timestamp?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
}

interface HealthStats {
  condition: string;
  count: number;
  avgSystolic?: number;
  avgDiastolic?: number;
  avgHeartRate?: number;
  avgGlucose?: number;
  period: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RelativeDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientInfo | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'messages' | 'profile'>('overview');
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.role !== 'relative') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchPatientData(parsedUser);
  }, [router]);

  const fetchPatientData = async (relativeUser: User) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch patient profile
      if (relativeUser.monitoredPatientProfile) {
        const response = await fetch(`${API_BASE_URL}/api/patients/${relativeUser.monitoredPatientProfile}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPatientData(data.data);
          }
        }
      }

      // Fetch patient vitals if we have patient ID
      if (relativeUser.monitoredPatient) {
        await Promise.all([
          fetchPatientVitals(relativeUser.monitoredPatient.id),
          fetchHealthSummary(relativeUser.monitoredPatient.id),
          fetchHealthStats(relativeUser.monitoredPatient.id)
        ]);
      }

    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientVitals = async (patientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/patient-vitals/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVitals(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const fetchHealthSummary = async (patientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/patient-vitals/${patientId}/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchHealthStats = async (patientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/patient-vitals/${patientId}/stats?days=30`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user?.monitoredPatient) {
      setError('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: user.monitoredPatient,
          message: message.trim(),
          messageType: 'relative_to_patient'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Message sent successfully!');
        setMessage('');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getHealthStatus = () => {
    if (!summary || !summary.hasData) return 'No Data';
    
    if (summary.systolic && summary.diastolic) {
      if (summary.systolic > 140 || summary.diastolic > 90) {
        return 'High';
      } else if (summary.systolic < 90 || summary.diastolic < 60) {
        return 'Low';
      }
      return 'Normal';
    }
    
    if (summary.glucose) {
      if (summary.glucose > 180) return 'High';
      if (summary.glucose < 70) return 'Low';
      return 'Normal';
    }
    
    return 'Unknown';
  };

  const getHealthStatusColor = () => {
    const status = getHealthStatus();
    switch (status) {
      case 'High': return 'text-red-600';
      case 'Low': return 'text-yellow-600';
      case 'Normal': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                👨‍👩‍👧‍👦 Family Health Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Patient Info Header */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {patientData?.picture ? (
                  <img 
                    src={patientData.picture} 
                    alt={patientData?.name || 'Patient'} 
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-2xl font-semibold">
                      {patientData?.name?.[0] || 'P'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {patientData?.name || 'Patient Name'}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {user.relationship || 'Family Member'}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor().replace('text-', 'bg-').replace('600', '100')} ${getHealthStatusColor()}`}>
                    Health: {getHealthStatus()}
                  </span>
                  {patientData?.diabetes && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Diabetes
                    </span>
                  )}
                  {patientData?.hypertension && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      Hypertension
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'vitals' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Health Data
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'messages' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Health Summary</h3>
                
                {summary?.hasData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summary.systolic !== undefined && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Systolic BP</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.systolic}</p>
                        <p className="text-xs text-gray-500">mmHg</p>
                      </div>
                    )}
                    
                    {summary.diastolic !== undefined && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Diastolic BP</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.diastolic}</p>
                        <p className="text-xs text-gray-500">mmHg</p>
                      </div>
                    )}
                    
                    {summary.heartRate !== undefined && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Heart Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.heartRate}</p>
                        <p className="text-xs text-gray-500">BPM</p>
                      </div>
                    )}
                    
                    {summary.glucose !== undefined && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600">Glucose</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.glucose}</p>
                        <p className="text-xs text-gray-500">mg/dL</p>
                      </div>
                    )}
                    
                    {summary.timestamp && (
                      <div className="col-span-2 md:col-span-4 mt-4">
                        <p className="text-sm text-gray-500">Last updated: {formatDate(summary.timestamp)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No health data available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Statistics</h3>
              
              {stats ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Readings</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                  </div>
                  
                  {stats.avgSystolic !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Avg. Systolic BP</p>
                      <p className="text-xl font-semibold text-gray-900">{stats.avgSystolic} mmHg</p>
                    </div>
                  )}
                  
                  {stats.avgDiastolic !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Avg. Diastolic BP</p>
                      <p className="text-xl font-semibold text-gray-900">{stats.avgDiastolic} mmHg</p>
                    </div>
                  )}
                  
                  {stats.avgGlucose !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Avg. Glucose</p>
                      <p className="text-xl font-semibold text-gray-900">{stats.avgGlucose} mg/dL</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No statistics available</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-3">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('vitals')}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                  >
                    <h4 className="font-medium text-blue-700">View All Health Data</h4>
                    <p className="text-sm text-blue-600 mt-1">See detailed health records</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
                  >
                    <h4 className="font-medium text-green-700">Send Message</h4>
                    <p className="text-sm text-green-600 mt-1">Communicate with {patientData?.name?.split(' ')[0] || 'patient'}</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                  >
                    <h4 className="font-medium text-purple-700">Patient Profile</h4>
                    <p className="text-sm text-purple-600 mt-1">View patient information</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Health Records</h3>
              <p className="mt-1 text-sm text-gray-500">Recent health measurements for {patientData?.name}</p>
            </div>
            
            {vitals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BP (mmHg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Heart Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Glucose
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vitals.slice(0, 10).map((vital) => (
                      <tr key={vital.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(vital.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            vital.type === 'hypertension' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {vital.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vital.heartRate ? `${vital.heartRate} BPM` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vital.glucose ? `${vital.glucose} mg/dL` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No health records available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Send Message Form */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Send Message to {patientData?.name?.split(' ')[0] || 'Patient'}</h3>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    {success}
                  </div>
                )}
                
                <form onSubmit={handleSendMessage}>
                  <div className="mb-4">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Type your message to ${patientData?.name}...`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              
              {patientData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Patient Name</p>
                    <p className="font-medium text-gray-900">{patientData.name}</p>
                  </div>
                  
                  {patientData.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{patientData.email}</p>
                    </div>
                  )}
                  
                  {patientData.phoneNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{patientData.phoneNumber}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Your Relationship</h4>
                    <p className="text-gray-900">{user.relationship}</p>
                    <p className="text-sm text-gray-500 mt-1">Access Level: {user.accessLevel}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No contact information available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && patientData && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Patient Profile</h3>
              <p className="mt-1 text-sm text-gray-500">Complete health profile for {patientData.name}</p>
            </div>
            
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {patientData.name}
                  </dd>
                </div>
                
                {patientData.dob && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {new Date(patientData.dob).toLocaleDateString()} ({calculateAge(patientData.dob)} years old)
                    </dd>
                  </div>
                )}
                
                {patientData.gender && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {patientData.gender}
                    </dd>
                  </div>
                )}
                
                {patientData.allergies && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {patientData.allergies}
                    </dd>
                  </div>
                )}
                
                {patientData.surgeries && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Surgeries</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {patientData.surgeries}
                    </dd>
                  </div>
                )}
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Medical Conditions</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {patientData.diabetes && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Diabetes
                        </span>
                      )}
                      {patientData.hypertension && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Hypertension
                        </span>
                      )}
                      {!patientData.diabetes && !patientData.hypertension && (
                        <span className="text-sm text-gray-500">No known conditions</span>
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Access Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Access Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Your access level: <strong>{user.accessLevel}</strong>. 
                  {user.accessLevel === 'view_only' && ' You can view information but cannot make changes.'}
                  {user.accessLevel === 'caretaker' && ' You can view information and communicate with the patient.'}
                  {user.accessLevel === 'emergency_only' && ' You only have access to emergency contact information.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}