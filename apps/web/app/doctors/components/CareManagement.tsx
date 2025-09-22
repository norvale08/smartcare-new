'use client';
import React, { useState } from 'react';
import { Prescription, CareNote, Patient, Condition } from '@/types/doctor';
import { Plus, Edit3, X, Pill, FileText, Calendar, Apple, Dumbbell, Send } from 'lucide-react';
import { chatWithOllama } from '@/lib/ollamaClient';
import ReactMarkdown from "react-markdown";


interface CareManagementProps {
  prescriptions: Prescription[];
  careNotes: CareNote[];
  selectedPatient: Patient | null;
  onAddPrescription: (prescription: Omit<Prescription, 'id'>) => void;
  onAddCareNote: (note: Omit<CareNote, 'id'>) => void;
}

const CareManagement: React.FC<CareManagementProps> = ({
  prescriptions,
  careNotes,
  selectedPatient,
  onAddPrescription,
  onAddCareNote
}) => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'notes'>('prescriptions');
  const [showAddForm, setShowAddForm] = useState(false);

  // chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  // prescriptions
  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  // care note
  const [newNote, setNewNote] = useState({
    note: '',
    type: 'observation' as 'observation' | 'treatment' | 'consultation'
  });

  // recommendations
  const [nutritionRecommendation, setNutritionRecommendation] = useState('');
  const [lifestyleRecommendation, setLifestyleRecommendation] = useState('');

  const handleAddPrescription = () => {
    if (!selectedPatient || !newPrescription.medication) return;

    onAddPrescription({
      patientId: selectedPatient.id!.toString(),
      ...newPrescription
    });

    setNewPrescription({
      medication: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleAddNote = () => {
    if (!selectedPatient || (!newNote.note && !nutritionRecommendation && !lifestyleRecommendation)) return;
    // Combine free note + recommendations into one care note text
    const combinedNote =
      `${newNote.note ? newNote.note + "\n\n" : ""}` +
      `${nutritionRecommendation ? "**🍎 **Nutrition:** " + nutritionRecommendation + "\n\n" : ""}` +
      `${lifestyleRecommendation ? "**🏋️ Lifestyle:** " + lifestyleRecommendation : ""}`;

    onAddCareNote({
      patientId: selectedPatient.id!.toString(),
      note: combinedNote.trim(),
      type: newNote.type,
      timestamp: new Date().toISOString(),
    });

    // Reset states
    setNewNote({ note: "", type: "observation" });
    setNutritionRecommendation("");
    setLifestyleRecommendation("");
    setShowAddForm(false);
  };

  // chatbot message handling
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { sender: "user" as const, text: userInput };
    setChatMessages((prev) => [...prev, newMessage]);

    setUserInput("");
    setLoading(true);

    // Start with an empty AI message placeholder
    let aiReply = { sender: "ai" as const, text: "" };
    setChatMessages((prev) => [...prev, aiReply]);

    try {
      await chatWithOllama(
        `You are a healthcare assistant. Based on this patient’s needs, give nutrition and lifestyle recommendations.\n\nUser: ${userInput}\nAI:`,
        (token) => {
          // Append tokens as they come in
          aiReply = { ...aiReply, text: aiReply.text + token };
          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = aiReply;
            return updated;
          });
        }
      );
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Something went wrong calling Ollama." },
      ]);
    } finally {
      setLoading(false);
    }
  };


  const patientPrescriptions = prescriptions.filter(
    (p) => selectedPatient?.id && p.patientId === selectedPatient.id.toString()
  );
  const patientNotes = careNotes.filter(
    (n) => selectedPatient?.id && n.patientId === selectedPatient.id.toString()
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {selectedPatient ? `${selectedPatient.name} - Care Management (${selectedPatient.condition})` : 'Care Management'}
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-sm text-white px-2 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add {activeTab === 'prescriptions' ? 'Prescription' : 'Note'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'prescriptions'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <Pill className="h-4 w-4" />
          <span>Prescriptions</span>
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
            {patientPrescriptions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === 'notes'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <FileText className="h-4 w-4" />
          <span>Care Notes</span>
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
            {patientNotes.length}
          </span>
        </button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add {activeTab === 'prescriptions' ? 'Prescription' : 'Care Note'}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {activeTab === 'prescriptions' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication
                  </label>
                  <input
                    type="text"
                    value={newPrescription.medication}
                    onChange={(e) => setNewPrescription({ ...newPrescription, medication: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter medication name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={newPrescription.dosage}
                      onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 10mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={newPrescription.frequency}
                      onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newPrescription.startDate}
                      onChange={(e) => setNewPrescription({ ...newPrescription, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newPrescription.endDate}
                      onChange={(e) => setNewPrescription({ ...newPrescription, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newPrescription.notes}
                    onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes or instructions"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddPrescription}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Prescription
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Care Note form */
              <div className="space-y-4">
                {/* Note Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newNote.type}
                    onChange={(e) => setNewNote({ ...newNote, type: e.target.value as 'observation' | 'treatment' | 'consultation' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="observation">Observation</option>
                    <option value="treatment">Treatment</option>
                    <option value="consultation">Consultation</option>
                  </select>
                </div>
                {/* Care Note Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={newNote.note}
                    onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter care note..."
                  />
                </div>


                {/* Nutrition Recommendations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center">
                      <Apple className="w-4 h-4 mr-2 text-green-500" />
                      Nutrition Plan
                    </h4>
                    <button
                      onClick={() => setShowChatbot(true)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      AI Generate
                    </button>
                  </div>
                  <textarea
                    placeholder="Nutrition recommendations..."
                    value={nutritionRecommendation}
                    onChange={(e) => setNutritionRecommendation(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm h-20 resize-none"
                  />
                </div>

                {/* Lifestyle Recommendations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center">
                      <Dumbbell className="w-4 h-4 mr-2 text-purple-500" />
                      Lifestyle Plan
                    </h4>
                    <button
                      onClick={() => setShowChatbot(true)}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                    >
                      AI Generate
                    </button>
                  </div>
                  <textarea
                    placeholder="Lifestyle recommendations..."
                    value={lifestyleRecommendation}
                    onChange={(e) => setLifestyleRecommendation(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm h-20 resize-none"
                  />
                </div>

                {/* Save buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddNote}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 flex flex-col h-[500px]">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <h3 className="text-lg font-semibold">SmartCare Assistant</h3>
              <button onClick={() => setShowChatbot(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 border rounded">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg max-w-[80%] ${msg.sender === 'user'
                    ? 'bg-blue-100 text-blue-800 self-end ml-auto'
                    : 'bg-gray-100 text-gray-800 self-start'
                    }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && <p className="text-sm text-gray-500">AI is typing...</p>}
            </div>

            {/* Input */}
            <div className="flex items-center mt-3">
              <input
                type="text"
                placeholder="Ask about nutrition or lifestyle..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className="ml-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {activeTab === "prescriptions" ? (
            patientPrescriptions.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No prescriptions found</p>
                <p className="text-sm text-gray-400">
                  Add a prescription to get started
                </p>
              </div>
            ) : (
              patientPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {prescription.medication}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {prescription.dosage} - {prescription.frequency}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(prescription.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <span>to</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(prescription.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {prescription.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                      {prescription.notes}
                    </p>
                  )}
                </div>
              ))
            )
          ) : patientNotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No care notes found</p>
              <p className="text-sm text-gray-400">
                Add a care note to get started
              </p>
            </div>
          ) : (
            patientNotes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${note.type === "observation"
                      ? "bg-blue-100 text-blue-700"
                      : note.type === "treatment"
                        ? "bg-green-100 text-green-700"
                        : "bg-purple-100 text-purple-700"
                      }`}
                  >
                    {note.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{note.note}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


    </div>
  );
};

export default CareManagement;
