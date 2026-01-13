'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Separate the component that uses useSearchParams
function RelativeSetupContent() {
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [relativeInfo, setRelativeInfo] = useState<any>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  // Verify token on page load
  useEffect(() => {
    if (!token) {
      setError('No setup token found. Please use the link from your email.');
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/relative-setup/verify-invitation/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setRelativeInfo(data.data);
      } else {
        setError(data.message || 'Invalid or expired setup link.');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setError('Failed to verify setup link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPasswordError('');

    // Validate passwords
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Token is missing');
      return;
    }

    setSetupLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/relative-setup/complete-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Account setup completed successfully!');
        
        // Store token and user data
        if (data.data.token) {
          localStorage.setItem('token', data.data.token);
        }
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push(data.data.redirectTo || '/relatives/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Setup failed. Please try again.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your setup link...</p>
        </div>
      </div>
    );
  }

  if (error && !relativeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Setup Link Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              href="/login" 
              className="text-blue-600 hover:underline font-medium"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">👨‍👩‍👧‍👦 Family Access Setup</h1>
          <p className="mt-2 text-gray-600">Complete your account setup</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {relativeInfo && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="font-semibold text-blue-800 mb-2">Invitation Details</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Patient:</span> {relativeInfo.patientName}</p>
                <p><span className="font-medium">Your Relationship:</span> {relativeInfo.relationship}</p>
                <p><span className="font-medium">Access Level:</span> 
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {relativeInfo.accessLevel === 'view_only' ? 'View Only' : 
                     relativeInfo.accessLevel === 'caretaker' ? 'Caretaker' : 
                     relativeInfo.accessLevel === 'emergency_only' ? 'Emergency Only' : 
                     relativeInfo.accessLevel}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Link expires: {new Date(relativeInfo.invitationExpires).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Create Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password (min. 6 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            {passwordError && (
              <div className="text-red-600 text-sm">{passwordError}</div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={setupLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setupLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  'Complete Setup & Login'
                )}
              </button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>By completing setup, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-center">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function SetupLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function RelativeSetupPage() {
  return (
    <Suspense fallback={<SetupLoadingFallback />}>
      <RelativeSetupContent />
    </Suspense>
  );
}