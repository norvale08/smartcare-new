// app/caretaker/components/PatientRequests.tsx
import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

interface PatientRequest {
  _id: string;
  patientId: string;
  patientName: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface PatientRequestsProps {
  onRequestUpdate?: () => void; // Optional callback to refresh assigned patients
}

const PatientRequests: React.FC<PatientRequestsProps> = ({ onRequestUpdate }) => {
  const [patientRequests, setPatientRequests] = useState<PatientRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const getApiBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  };

  const fetchPatientRequests = async () => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/doctor/pending-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatientRequests(data.pendingRequests || []);
      } else {
        console.error('Failed to fetch patient requests');
      }
    } catch (error) {
      console.error('Error fetching patient requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/doctor/accept-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId: requestId }),
      });

      if (response.ok) {
        // Refresh the requests list
        await fetchPatientRequests();
        // Notify parent to refresh assigned patients
        if (onRequestUpdate) {
          onRequestUpdate();
        }
      } else {
        console.error('Failed to accept request');
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to accept request'}`);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Error accepting request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${getApiBaseUrl()}/api/doctor/reject-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId: requestId }),
      });

      if (response.ok) {
        // Refresh the requests list
        await fetchPatientRequests();
        // Notify parent to refresh assigned patients
        if (onRequestUpdate) {
          onRequestUpdate();
        }
      } else {
        console.error('Failed to reject request');
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to reject request'}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };
  

  useEffect(() => {
    fetchPatientRequests();
    
    // Refresh requests every 30 seconds
    const interval = setInterval(fetchPatientRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loadingRequests) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Patient Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Patient Requests</span>
          {patientRequests.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {patientRequests.length} new
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {patientRequests.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No pending patient requests</p>
            <p className="text-sm mt-1">Patients will appear here when they request you</p>
          </div>
        ) : (
          patientRequests.map((request) => (
            <div
              key={request._id}
              className="p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{request.patientName}</h4>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      New Request
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Wants to be your patient</p>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(request.requestedAt)}</span>
                    <span>•</span>
                    <span>{new Date(request.requestedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-3">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.patientId)}
                    disabled={processingRequest === request._id}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingRequest === request._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-2"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request.patientId)}
                    disabled={processingRequest === request._id}
                    className="text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default PatientRequests;
