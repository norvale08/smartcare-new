"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui';
import { toast } from 'react-hot-toast';
import CustomToaster from '../components/ui/CustomToaster';
import { FaHeartbeat, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Loader2, Mail, Shield, ArrowRight } from 'lucide-react';

// Separate component that uses useSearchParams
function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setError('Invalid activation link. Missing token or email.');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/activate/verify-token?token=${token}&email=${encodeURIComponent(email)}`,
          { method: 'GET' }
        );

        const result = await response.json();

        if (result.valid) {
          setTokenValid(true);
          setUserData(result.user);
        } else {
          setError(result.message || 'Invalid activation link');
          if (result.alreadyActivated) {
            setTimeout(() => router.push('/login'), 3000);
          }
        }
      } catch (err) {
        setError('Failed to verify activation link. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, email, API_URL, router]);

  const handleActivation = async () => {
    if (!token || !email) {
      toast.error('Invalid activation link');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/activate/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Activation failed');
      }

      toast.success('Account activated successfully! Redirecting to login...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Activation failed';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
      <CustomToaster />

      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-400 to-blue-950 p-6 text-white text-center">
            <div className="flex items-center justify-center mb-3">
              <FaHeartbeat className="text-3xl mr-2" />
              <h1 className="text-2xl font-bold">SmartCare</h1>
            </div>
            <p className="text-sm opacity-90">Account Activation</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {isVerifying ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-600">Verifying activation link...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Activation Failed
                </h2>
                <p className="text-red-600 mb-6">{error}</p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Go to Login
                </Button>
              </div>
            ) : tokenValid && userData ? (
              <div>
                <div className="text-center mb-6">
                  <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Activate Your Account
                  </h2>
                  <p className="text-gray-600">
                    Your account has been approved by our admin team!
                  </p>
                </div>

                {/* User Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {userData.firstName} {userData.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{userData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Activation Steps */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    What happens after activation?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Your account will be fully activated</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>You can log in immediately</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Access all SmartCare features</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>Complete your health profile</span>
                    </li>
                  </ul>
                </div>

                {/* Activation Button */}
                <Button
                  onClick={handleActivation}
                  disabled={isLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 disabled:bg-gray-300"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Activating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Activate My Account
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </span>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By activating your account, you agree to SmartCare's Terms of Service
                  and Privacy Policy.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600">Invalid activation state</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Contact{' '}
          <a href="mailto:support@smartcare.com" className="text-emerald-600 hover:underline">
            support@smartcare.com
          </a>
        </p>
      </div>
    </div>
  );
}

// Loading fallback component
function ActivateAccountLoading() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-400 to-blue-950 p-6 text-white text-center">
            <div className="flex items-center justify-center mb-3">
              <FaHeartbeat className="text-3xl mr-2" />
              <h1 className="text-2xl font-bold">SmartCare</h1>
            </div>
            <p className="text-sm opacity-90">Account Activation</p>
          </div>
          <div className="p-8">
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
const ActivateAccount = () => {
  return (
    <Suspense fallback={<ActivateAccountLoading />}>
      <ActivateAccountContent />
    </Suspense>
  );
};

export default ActivateAccount;