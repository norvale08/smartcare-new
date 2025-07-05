'use client';
import React, { useState } from 'react';
import { Prescription, CareNote, Patient } from '../../types/doctors';;
import { Plus, Edit3, Save, X, Pill, FileText, Calendar } from 'lucide-react';

interface PrescriptionPanelProps {
    prescriptions: Prescription[];
    careNotes: CareNote[];
    selectedPatient: Patient | null;
    onAddPrescription: (prescription: Omit<Prescription, 'id'>) => void;
    onAddCareNote: (note: Omit<CareNote, 'id'>) => void;
}

const PrescriptionPanel: React.FC<PrescriptionPanelProps> = ({
    prescriptions,
    careNotes,
    selectedPatient,
    onAddPrescription,
    onAddCareNote
}) => {
    const [activeTab, setActiveTab] = useState<'prescriptions' | 'notes'>('prescriptions');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPrescription, setNewPrescription] = useState({
        medication: '',
        dosage: '',
        frequency: '',
        startDate: '',
        endDate: '',
        notes: ''
    });
    const [newNote, setNewNote] = useState({
        note: '',
        type: 'observation' as 'observation' | 'treatment' | 'consultation'
    });

    const handleAddPrescription = () => {
        if (!selectedPatient || !newPrescription.medication) return;

        onAddPrescription({
            patientId: selectedPatient.id,
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
        if (!selectedPatient || !newNote.note) return;

        onAddCareNote({
            patientId: selectedPatient.id,
            note: newNote.note,
            type: newNote.type,
            timestamp: new Date().toISOString()
        });

        setNewNote({
            note: '',
            type: 'observation'
        });
        setShowAddForm(false);
    };

    const patientPrescriptions = prescriptions.filter(p =>
        selectedPatient ? p.patientId === selectedPatient.id : true
    );

    const patientNotes = careNotes.filter(n =>
        selectedPatient ? n.patientId === selectedPatient.id : true
    );

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    {selectedPatient ? `${selectedPatient.name} - Care Management` : 'Care Management'}
                </h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add {activeTab === 'prescriptions' ? 'Prescription' : 'Note'}</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
                <button
                    onClick={() => setActiveTab('prescriptions')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'prescriptions'
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
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'notes'
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
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={newNote.type}
                                        onChange={(e) => setNewNote({ ...newNote, type: e.target.value as any })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="observation">Observation</option>
                                        <option value="treatment">Treatment</option>
                                        <option value="consultation">Consultation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Note
                                    </label>
                                    <textarea
                                        value={newNote.note}
                                        onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                        placeholder="Enter care note details..."
                                    />
                                </div>
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

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'prescriptions' ? (
                    patientPrescriptions.length === 0 ? (
                        <div className="text-center py-8">
                            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No prescriptions found</p>
                            <p className="text-sm text-gray-400">Add a prescription to get started</p>
                        </div>
                    ) : (
                        patientPrescriptions.map((prescription) => (
                            <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{prescription.medication}</h4>
                                        <p className="text-sm text-gray-600">{prescription.dosage} - {prescription.frequency}</p>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(prescription.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <span>to</span>
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(prescription.endDate).toLocaleDateString()}</span>
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
                ) : (
                    patientNotes.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No care notes found</p>
                            <p className="text-sm text-gray-400">Add a care note to get started</p>
                        </div>
                    ) : (
                        patientNotes.map((note) => (
                            <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${note.type === 'observation' ? 'bg-blue-100 text-blue-700' :
                                            note.type === 'treatment' ? 'bg-green-100 text-green-700' :
                                                'bg-purple-100 text-purple-700'
                                        }`}>
                                        {note.type}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(note.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700">{note.note}</p>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};
export default PrescriptionPanel;