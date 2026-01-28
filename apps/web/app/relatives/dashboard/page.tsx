'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './components/Header';
import { PatientHeader } from './components/PatientHeader';
import { TabNavigation } from './components/TabNavigation';
import { OverviewTab } from './components/tabs/OverviewTab';
import { VitalsTab } from './components/tabs/VitalsTab';
import MedicationsTab from './components/tabs/MedicationsTab';
import { MessagesTab } from './components/tabs/MessagesTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { HealthAlerts } from './components/HealthAlerts';
import { StatusMessages } from './components/StatusMessages';
import { AccessNotice } from './components/AccessNotice';
import { useDashboardData } from './hooks/useDashboardData';
import { useDismissedAlerts } from './hooks/useDismissedAlerts';
import { DashboardUtils } from './utils';
import { TabType, ChartMetric, ChartPeriod, HealthAlert } from './types';
import { AlertTriangle } from 'lucide-react';

export default function RelativeDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(7);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('bloodPressure');
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [success, setSuccess] = useState('');
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);

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

  const {
    dismissedAlerts,
    dismissAlert,
    dismissAllAlerts,
    clearDismissedAlerts,
    isAlertDismissed
  } = useDismissedAlerts();

  useEffect(() => {
    if (vitals.length > 0 && patientData) {
      const alerts = DashboardUtils.generateHealthAlerts(vitals, patientData);
      setHealthAlerts(alerts);
    }
  }, [vitals, patientData]);

  const filteredAlerts = healthAlerts.filter(alert => !isAlertDismissed(alert.id));

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId);
    const dismissedAlert = healthAlerts.find(a => a.id === alertId);
    if (dismissedAlert) {
      setSuccess(`Alert dismissed: ${dismissedAlert.vital} alert`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDismissAllAlerts = () => {
    const alertIds = filteredAlerts.map(alert => alert.id);
    if (alertIds.length > 0) {
      dismissAllAlerts(alertIds);
      setSuccess('All alerts have been dismissed');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const chartData = DashboardUtils.prepareChartData(vitals, chartPeriod);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetId = user?.monitoredPatient;

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!targetId) {
      setError('Cannot send message - patient information missing');
      return;
    }

    try {
      setSendingMessage(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const messageData = {
        receiverId: targetId,
        content: message.trim(),
        type: 'text'
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/relative-messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMessage('');
        setSuccess('Message sent successfully!');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (err: any) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearDismissedAlerts();
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

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {filteredAlerts.length > 0 ? (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Critical Health Alerts ({filteredAlerts.length})
                  </h3>
                  <p className="text-sm text-red-700">
                    {filteredAlerts.filter(a => a.severity === 'critical').length} critical condition alerts detected
                  </p>
                </div>
                <button
                  onClick={handleDismissAllAlerts}
                  className="px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  Dismiss All
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Health Monitoring Status
                  </h3>
                  <p className="text-sm text-gray-600">
                    {dismissedAlerts.size > 0
                      ? `${dismissedAlerts.size} alerts currently hidden`
                      : 'No critical alerts'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {dismissedAlerts.size > 0 && (
                    <button
                      onClick={clearDismissedAlerts}
                      className="px-3 py-1.5 text-sm bg-blue-100 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Show All Alerts
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <HealthAlerts
            alerts={filteredAlerts}
            onDismissAlert={handleDismissAlert}
          />

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
              <MedicationsTab />
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