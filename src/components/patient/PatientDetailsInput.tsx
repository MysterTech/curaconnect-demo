import React, { useState, useEffect, useRef } from 'react';

export interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  lastVisit?: Date;
  visitHistory?: string[];
}

interface PatientDetailsInputProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  visitCategory?: string;
  isRecording?: boolean;
  disabled?: boolean;
}

export const PatientDetailsInput: React.FC<PatientDetailsInputProps> = ({
  selectedPatient,
  onPatientSelect,
  visitCategory,
  isRecording = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load patients from storage
  useEffect(() => {
    loadPatients();
  }, []);

  // Filter patients based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(query) ||
        patient.phone?.includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPatients = async () => {
    try {
      const stored = localStorage.getItem('medscribe_patients');
      if (stored) {
        const parsedPatients = JSON.parse(stored);
        setPatients(parsedPatients);
      } else {
        // Initialize with some sample patients
        const samplePatients: Patient[] = [
          { id: '1', name: 'John', phone: '555-0101', lastVisit: new Date('2024-01-15') },
          { id: '2', name: 'John1', phone: '555-0102', lastVisit: new Date('2024-01-10') }
        ];
        setPatients(samplePatients);
        localStorage.setItem('medscribe_patients', JSON.stringify(samplePatients));
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const savePatients = (updatedPatients: Patient[]) => {
    try {
      localStorage.setItem('medscribe_patients', JSON.stringify(updatedPatients));
      setPatients(updatedPatients);
    } catch (error) {
      console.error('Failed to save patients:', error);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    onPatientSelect(patient);
    setSearchQuery('');
    setIsOpen(false);
    setShowCreateForm(false);
  };

  const handleCreateNewPatient = () => {
    if (newPatientName.trim()) {
      const newPatient: Patient = {
        id: Date.now().toString(),
        name: newPatientName.trim(),
        lastVisit: new Date()
      };
      const updatedPatients = [...patients, newPatient];
      savePatients(updatedPatients);
      handleSelectPatient(newPatient);
      setNewPatientName('');
    }
  };

  const handleJustUse = () => {
    if (searchQuery.trim()) {
      const tempPatient: Patient = {
        id: 'temp-' + Date.now(),
        name: searchQuery.trim()
      };
      handleSelectPatient(tempPatient);
    }
  };

  const handleClearPatient = () => {
    onPatientSelect(null);
    setSearchQuery('');
  };

  const getSuggestedPatients = () => {
    return patients
      .filter(p => p.lastVisit)
      .sort((a, b) => {
        const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  };

  const formatLastVisit = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Patient Display */}
      {selectedPatient && !isOpen ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h3>
                {visitCategory && (
                  <p className="text-sm text-gray-600 mt-1">{visitCategory}</p>
                )}
                {selectedPatient.phone && (
                  <p className="text-xs text-gray-500 mt-1">{selectedPatient.phone}</p>
                )}
              </div>
            </div>
            {!isRecording && !disabled && (
              <button
                onClick={handleClearPatient}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove patient"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <button
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className="w-full text-left bg-white rounded-lg border border-gray-300 p-4 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-gray-500">Add patient details</span>
            </div>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient name, phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="max-h-80 overflow-y-auto">
                {/* Quick Actions */}
                {searchQuery.trim() && (
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Create new patient</span>
                    </button>
                    <button
                      onClick={handleJustUse}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-sm text-gray-700">Just use "{searchQuery}"</span>
                    </button>
                  </div>
                )}

                {/* Create New Patient Form */}
                {showCreateForm && (
                  <div className="p-4 border-b border-gray-200 bg-indigo-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Patient</h4>
                    <input
                      type="text"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      placeholder="Patient name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateNewPatient();
                        }
                      }}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateNewPatient}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewPatientName('');
                        }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggested Patients */}
                {!searchQuery && getSuggestedPatients().length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase">Suggested</h4>
                    </div>
                    {getSuggestedPatients().map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                          {patient.phone && (
                            <div className="text-xs text-gray-500">{patient.phone}</div>
                          )}
                        </div>
                        {patient.lastVisit && (
                          <div className="text-xs text-gray-400">{formatLastVisit(patient.lastVisit)}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* All Patients */}
                {filteredPatients.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase">
                        {searchQuery ? 'Search Results' : 'All Patients'}
                      </h4>
                    </div>
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                          {patient.phone && (
                            <div className="text-xs text-gray-500">{patient.phone}</div>
                          )}
                        </div>
                        {patient.lastVisit && (
                          <div className="text-xs text-gray-400">{formatLastVisit(patient.lastVisit)}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searchQuery && filteredPatients.length === 0 && !showCreateForm && (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm">No patients found</p>
                    <p className="text-xs mt-1">Try creating a new patient or use the name as-is</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
