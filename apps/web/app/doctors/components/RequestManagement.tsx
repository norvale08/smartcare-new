"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Check, X, Clock } from 'lucide-react';

interface AssignmentRequest {
  _id: string;
  patientId: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  type: 'doctor' | 'hospital';
  message?: string;
  createdAt: string;
}

interface RequestManagementProps {
  token: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const RequestManagement: React.FC<RequestManagementProps> = ({ token }) => {
  const [requests, setRequests] = useState<AssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/assignment/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await axios.patch(`${API_URL}/api/assignment/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await axios.patch(`${API_URL}/api/assignment/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading requests...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock size={20} />
        Pending Assignment Requests ({requests.length})
      </h3>
      {requests.length === 0 ? (
        <p className="text-gray-500 text-center">No pending requests</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
              {requests.map((request) => (
                <div key={request._id} className="border rounded p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="text-white w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{request.patientId?.fullName || 'Unknown Patient'}</p>
                      <p className="text-sm text-gray-500">{request.patientId?.email || 'No email'}</p>
                    </div>
                  </div>
                  {request.message && <p className="text-sm text-gray-600 mb-2">{request.message}</p>}
                  <p className="text-xs text-gray-400 mb-3">
                    Requested {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request._id)}
                      className="flex-1 bg-green-500 text-white py-1 rounded text-sm hover:bg-green-600 flex items-center gap-1 justify-center"
                    >
                      <Check size={14} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      className="flex-1 bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600 flex items-center gap-1 justify-center"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

export default RequestManagement;
