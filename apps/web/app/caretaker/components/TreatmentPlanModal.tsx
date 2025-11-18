// app/caretaker/components/TreatmentPlanModal.tsx
import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Edit, Save, Plus } from 'lucide-react';

interface TreatmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

interface TreatmentPlan {
  goals: string[];
  medications: string[];
  lifestyle: string[];
  monitoring: string[];
  followUp: string;
}

const TreatmentPlanModal: React.FC<TreatmentPlanModalProps> = ({
  isOpen,
  onClose,
  patient
}) => {
  const [plan, setPlan] = useState<TreatmentPlan>({
    goals: [],
    medications: [],
    lifestyle: [],
    monitoring: [],
    followUp: ''
  });
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof TreatmentPlan>('goals');

  useEffect(() => {
    if (isOpen) {
      // Load existing treatment plan or create default
      const defaultPlan: TreatmentPlan = {
        goals: [
          `Maintain blood pressure below ${patient.condition === 'hypertension' ? '140/90 mmHg' : 'target range'}`,
          patient.condition === 'diabetes' ? 'Keep fasting glucose below 130 mg/dL' : 'Regular exercise 30 mins daily',
          'Follow prescribed medication schedule'
        ],
        medications: [
          'Take medications as prescribed',
          'Report any side effects immediately',
          'Do not skip doses'
        ],
        lifestyle: [
          'Reduce salt intake',
          'Maintain healthy weight',
          'Regular physical activity',
          'Stress management'
        ],
        monitoring: [
          'Daily blood pressure checks',
          patient.condition === 'diabetes' ? 'Weekly glucose monitoring' : 'Monthly follow-ups',
          'Track symptoms and side effects'
        ],
        followUp: 'Schedule follow-up appointment in 4 weeks'
      };
      setPlan(defaultPlan);
    }
  }, [isOpen, patient]);

  const addItem = () => {
    if (newItem.trim()) {
      setPlan(prev => ({
        ...prev,
        [activeCategory]: activeCategory === 'followUp' 
          ? newItem.trim()
          : [...(prev[activeCategory] as string[]), newItem.trim()]
      }));
      setNewItem('');
    }
  };

  const removeItem = (category: keyof TreatmentPlan, index: number) => {
    if (category === 'followUp') {
      // For followUp, just clear the string
      setPlan(prev => ({
        ...prev,
        followUp: ''
      }));
    } else {
      // For array categories, remove the item at the specified index
      setPlan(prev => ({
        ...prev,
        [category]: (prev[category] as string[]).filter((_: string, i: number) => i !== index)
      }));
    }
  };

  const savePlan = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/treatment-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient.id,
          plan,
          condition: patient.condition
        }),
      });

      if (response.ok) {
        setEditing(false);
        alert('Treatment plan saved successfully!');
      }
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      alert('Failed to save treatment plan');
    }
  };

  if (!isOpen) return null;

  const categories: { key: keyof TreatmentPlan; label: string; icon: string }[] = [
    { key: 'goals', label: 'Treatment Goals', icon: '🎯' },
    { key: 'medications', label: 'Medication Plan', icon: '💊' },
    { key: 'lifestyle', label: 'Lifestyle Changes', icon: '🏃' },
    { key: 'monitoring', label: 'Monitoring', icon: '📊' }
  ];

  // Helper function to check if a category is an array
  const isArrayCategory = (category: keyof TreatmentPlan): category is 'goals' | 'medications' | 'lifestyle' | 'monitoring' => {
    return category !== 'followUp';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Treatment Plan - {patient.fullName}</h2>
          </div>
          <div className="flex items-center space-x-2">
            {editing ? (
              <button
                onClick={savePlan}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Condition Overview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Condition: {patient.condition}</h3>
            <p className="text-sm text-gray-600">
              {patient.condition === 'hypertension' && 'Focus on blood pressure control and cardiovascular health'}
              {patient.condition === 'diabetes' && 'Focus on glucose management and metabolic health'}
              {patient.condition === 'both' && 'Comprehensive management of both hypertension and diabetes'}
            </p>
          </div>

          {/* Categories Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {categories.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  activeCategory === key
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-sm font-medium">{label}</div>
              </button>
            ))}
          </div>

          {/* Active Category Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {categories.find(cat => cat.key === activeCategory)?.label}
            </h3>

            {/* Items List */}
            <div className="space-y-2">
              {isArrayCategory(activeCategory) ? (
                // Render array items for array categories
                (plan[activeCategory] as string[]).map((item: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <span className="text-gray-700">{item}</span>
                    {editing && (
                      <button
                        onClick={() => removeItem(activeCategory, index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                // Render single item for followUp
                <div className="p-3 bg-white border rounded-lg">
                  <span className="text-gray-700">{plan[activeCategory] as string}</span>
                </div>
              )}
            </div>

            {/* Add New Item */}
            {editing && isArrayCategory(activeCategory) && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem()}
                  placeholder={`Add new ${categories.find(cat => cat.key === activeCategory)?.label.toLowerCase()}...`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addItem}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            )}
          </div>

          {/* Follow-up Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Follow-up Plan</h3>
            {editing ? (
              <textarea
                value={plan.followUp}
                onChange={(e) => setPlan(prev => ({ ...prev, followUp: e.target.value }))}
                rows={3}
                className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter follow-up instructions..."
              />
            ) : (
              <p className="text-blue-700">{plan.followUp}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlanModal;