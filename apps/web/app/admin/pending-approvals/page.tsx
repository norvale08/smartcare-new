"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { toast } from 'react-hot-toast';
import CustomToaster from '../../components/ui/CustomToaster';
import { FaUserClock, FaCheckCircle, FaTimesCircle, FaEnvelope, FaPhone } from 'react-icons/fa';
import { Loader2, RefreshCw } from 'lucide-react';

interface PendingPatient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
}

const PendingApprovalsPage = () => {
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    approvedPatients: 0,
    pendingApprovals: 0,
    approvalRate: '0'
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login as admin');
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/pending-approvals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setPendingPatients(result.data.pendingPatients);
      } else {
        toast.error(result.message || 'Failed to fetch pending approvals');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/approval-statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Statistics fetch error:', error);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    fetchStatistics();
  }, []);

  const handleApprove = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to approve ${patientName}?`)) {
      return;
    }

    try {
      setProcessingId(patientId);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/admin/approve-patient/${patientId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${patientName} approved! Activation email sent.`);
        // Remove from pending list
        setPendingPatients(prev => prev.filter(p => p._id !== patientId));
        // Refresh statistics
        fetchStatistics();
      } else {
        toast.error(result.message || 'Failed to approve patient');
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve patient');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (patientId: string, patientName: string) => {
    const reason = prompt(`Why are you rejecting ${patientName}?`);
    
    if (!reason) {
      return;
    }

    if (!confirm(`Are you sure you want to reject and delete ${patientName}'s account?`)) {
      return;
    }

    try {
      setProcessingId(patientId);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/admin/reject-patient/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${patientName}'s account has been rejected`);
        // Remove from pending list
        setPendingPatients(prev => prev.filter(p => p._id !== patientId));
        // Refresh statistics
        fetchStatistics();
      } else {
        toast.error(result.message || 'Failed to reject patient');
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject patient');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 p-6">
      <CustomToaster />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pending Patient Approvals
              </h1>
              <p className="text-gray-600">
                Review and approve new patient registrations
              </p>
            </div>
            <Button
              onClick={() => {
                fetchPendingApprovals();
                fetchStatistics();
              }}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalPatients}</p>
              </div>
              <FaUserClock className="text-3xl text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-2xl font-bold text-emerald-600">{statistics.approvedPatients}</p>
              </div>
              <FaCheckCircle className="text-3xl text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{statistics.pendingApprovals}</p>
              </div>
              <FaUserClock className="text-3xl text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approval Rate</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.approvalRate}%</p>
              </div>
              <FaCheckCircle className="text-3xl text-blue-500" />
            </div>
          </div>
        </div>

        {/* Pending Approvals List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Approvals ({pendingPatients.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : pendingPatients.length === 0 ? (
            <div className="text-center py-12">
              <FaCheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Approvals
              </h3>
              <p className="text-gray-600">
                All patient registrations have been processed
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingPatients.map((patient) => (
                <div
                  key={patient._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          Pending Approval
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-gray-400" />
                          <span>{patient.email}</span>
                        </div>
                        {patient.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <FaPhone className="text-gray-400" />
                            <span>{patient.phoneNumber}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Registered: {formatDate(patient.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      <Button
                        onClick={() => handleApprove(patient._id, `${patient.firstName} ${patient.lastName}`)}
                        disabled={processingId === patient._id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
                      >
                        {processingId === patient._id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => handleReject(patient._id, `${patient.firstName} ${patient.lastName}`)}
                        disabled={processingId === patient._id}
                        className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                      >
                        <FaTimesCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalsPage;