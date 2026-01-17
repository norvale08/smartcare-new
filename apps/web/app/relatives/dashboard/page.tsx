// relative/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './components/Header';
import { PatientHeader } from './components/PatientHeader';
import { TabNavigation } from './components/TabNavigation';
import { OverviewTab } from './components/tabs/OverviewTab';
import { VitalsTab } from './components/tabs/VitalsTab';
import { MedicationsTab } from './components/tabs/MedicationsTab';
import { MessagesTab } from './components/tabs/MessagesTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { HealthAlerts } from './components/HealthAlerts';
import { StatusMessages } from './components/StatusMessages';
import { AccessNotice } from './components/AccessNotice';
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardUtils } from './utils';
import { TabType, ChartMetric, ChartPeriod } from './types';

export default function RelativeDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(7);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('bloodPressure');
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [success, setSuccess] = useState('');
  const [healthAlerts, setHealthAlerts] = useState<any[]>([]);

  const router = useRouter();
  const {
    user,
    loading,
    patientData,
    vitals,
    summary,
    stats,
    medications,
    isRefreshing,
    error,
    bmiResult,
    setError,
    handleRefresh
  } = useDashboardData();

  // Generate health alerts when vitals change
  useEffect(() => {
    if (vitals.length > 0) {
      const alerts = DashboardUtils.generateHealthAlerts(vitals);
      setHealthAlerts(alerts);
    }
  }, [vitals]);

  const chartData = DashboardUtils.prepareChartData(vitals, chartPeriod);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/messages`, {
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
        setTimeout(() => setSuccess(''), 3000);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const markMedicationAsTaken = async (medicationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/medications/${medicationId}/mark-taken`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess('Medication marked as taken!');
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      setError('Failed to update medication status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-center text-sm sm:text-base">Loading patient data...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        isRefreshing={isRefreshing}
        onRefresh={() => handleRefresh(localStorage.getItem('token') || '')}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-4 lg:px-8">
        <div className="flex flex-col space-y-6">
          <PatientHeader
            patientData={patientData}
            user={user}
            summary={summary}
            bmiResult={bmiResult}
          />

          <HealthAlerts alerts={healthAlerts} />

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <StatusMessages error={error} success={success} />

          <div className="w-full flex flex-col space-y-6">
            {activeTab === 'overview' && (
              <OverviewTab
                summary={summary}
                chartData={chartData}
                selectedMetric={selectedMetric}
                chartPeriod={chartPeriod}
                stats={stats}
                patientData={patientData}
                onMetricChange={setSelectedMetric}
                onPeriodChange={setChartPeriod}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'vitals' && (
              <VitalsTab
                vitals={vitals}
                patientData={patientData}
              />
            )}

            {activeTab === 'medications' && (
              <MedicationsTab
                medications={medications}
                patientData={patientData}
                onMarkAsTaken={markMedicationAsTaken}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesTab
                patientData={patientData}
                user={user}
                message={message}
                sendingMessage={sendingMessage}
                onMessageChange={setMessage}
                onSendMessage={handleSendMessage}
              />
            )}

            {activeTab === 'profile' && patientData && (
              <ProfileTab patientData={patientData} />
            )}

            <AccessNotice user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}
