'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Input } from '@repo/ui';
import { Label } from '@repo/ui';

interface Patient {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  relationship?: string;
  patientName?: string;
  patientEmail?: string;
}

// Custom Select Components (since you might not have them)
const Select = ({ children, value, onValueChange, required }: any) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    >
      {children}
    </select>
  );
};

const SelectTrigger = ({ children }: any) => {
  return <div>{children}</div>;
};

const SelectValue = ({ placeholder }: any) => {
  return <span>{placeholder}</span>;
};

const SelectContent = ({ children }: any) => {
  return <>{children}</>;
};

const SelectItem = ({ children, value }: any) => {
  return <option value={value}>{children}</option>;
};

export default function CreateRelativeAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const [formData, setFormData] = useState({
    patientId: '',
    emergencyContactEmail: '',
    accessLevel: 'view_only',
    adminNotes: ''
  });

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/admin/patients-without-relatives');
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data.patients || []);
      } else {
        toast.error(data.message || 'Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    }
  };

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p._id === patientId);
    setSelectedPatient(patient || null);
    
    setFormData(prev => ({
      ...prev,
      patientId,
      emergencyContactEmail: patient?.email || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Submitting form data:', formData);
    
    // Validation
    if (!formData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    if (!formData.emergencyContactEmail) {
      toast.error('Please enter emergency contact email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emergencyContactEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating relative account...');

    try {
      console.log('🚀 Sending API request with data:', {
        patientId: formData.patientId,
        emergencyContactEmail: formData.emergencyContactEmail,
        accessLevel: formData.accessLevel,
        adminNotes: formData.adminNotes
      });

      const response = await fetch('/api/admin/create-relative-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          emergencyContactEmail: formData.emergencyContactEmail,
          accessLevel: formData.accessLevel,
          adminNotes: formData.adminNotes
        }),
      });

      const data = await response.json();
      console.log('📥 API Response:', data);

      if (!response.ok) {
        // Handle 400 Bad Request with specific error message
        if (response.status === 400) {
          const errorMessage = data.message || data.error || `Bad Request: ${JSON.stringify(data)}`;
          throw new Error(errorMessage);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        toast.success(data.message || 'Relative account created successfully', { id: toastId });
        
        // Reset form
        setFormData({
          patientId: '',
          emergencyContactEmail: '',
          accessLevel: 'view_only',
          adminNotes: ''
        });
        setSelectedPatient(null);
        
        // Optional: Redirect or refresh
        setTimeout(() => {
          router.push('/admin/relatives');
        }, 1500);
      } else {
        toast.error(data.message || 'Failed to create relative account', { id: toastId });
      }
    } catch (error: any) {
      console.error('❌ Error creating relative account:', error);
      toast.error(error.message || 'Failed to create relative account', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create Relative Account</CardTitle>
          <p className="text-muted-foreground">
            Grant family member access to a patient's health information
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label htmlFor="patientId">Select Patient *</Label>
              <Select 
                value={formData.patientId} 
                onValueChange={handlePatientChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <SelectItem key={patient._id} value={patient._id}>
                      {patient.fullName} ({patient.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPatient && (
                <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded mt-2">
                  <p><strong>Selected Patient:</strong> {selectedPatient.fullName}</p>
                  <p><strong>Patient Email:</strong> {selectedPatient.email}</p>
                  <p><strong>Relationship:</strong> {selectedPatient.relationship || 'Not specified'}</p>
                </div>
              )}
            </div>

            {/* Emergency Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="emergencyContactEmail">Emergency Contact Email *</Label>
              <Input
                id="emergencyContactEmail"
                type="email"
                placeholder="relative@example.com"
                value={formData.emergencyContactEmail}
                onChange={(e) => setFormData({...formData, emergencyContactEmail: e.target.value})}
                required
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                This is the email where the invitation will be sent. Must match patient's emergency contact email.
              </p>
            </div>

            {/* Access Level */}
            <div className="space-y-2">
              <Label htmlFor="accessLevel">Access Level *</Label>
              <Select 
                value={formData.accessLevel} 
                onValueChange={(value: string) => setFormData({...formData, accessLevel: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <option value="view_only">View Only (Can view information)</option>
                  <option value="caretaker">Caretaker (Can view and message doctors)</option>
                  <option value="emergency_only">Emergency Only (Limited emergency access)</option>
                </SelectContent>
              </Select>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <textarea
                id="adminNotes"
                placeholder="Add any notes about this relative account..."
                value={formData.adminNotes}
                onChange={(e) => setFormData({...formData, adminNotes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Debug Info (Remove in production) */}
            <div className="p-4 bg-gray-100 rounded text-sm">
              <p className="font-medium mb-2">Debug Information:</p>
              <div className="text-xs overflow-auto bg-white p-2 rounded border">
                <pre>{JSON.stringify(formData, null, 2)}</pre>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Relative Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          ← Back to Admin Panel
        </Button>
      </div>
    </div>
  );
}