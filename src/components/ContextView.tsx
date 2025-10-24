import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';

interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

interface ContextViewProps {
  vitalSigns: VitalSigns;
  onVitalSignsUpdate: (vitals: VitalSigns) => void;
}

export const ContextView: React.FC<ContextViewProps> = ({ vitalSigns, onVitalSignsUpdate }) => {
  const [vitals, setVitals] = useState<VitalSigns>(vitalSigns);
  const { showToast } = useToast();

  useEffect(() => {
    setVitals(vitalSigns);
  }, [vitalSigns]);

  const handleSave = () => {
    onVitalSignsUpdate(vitals);
    showToast('Vital signs saved successfully!', 'success');
  };

  const handleChange = (field: keyof VitalSigns, value: string | number) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Patient Context</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Vital Signs Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Vital Signs</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={vitals.bloodPressure || ''}
                  onChange={(e) => handleChange('bloodPressure', e.target.value)}
                  placeholder="120/80"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={vitals.heartRate || ''}
                  onChange={(e) => handleChange('heartRate', parseInt(e.target.value) || 0)}
                  placeholder="72"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature || ''}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || 0)}
                  placeholder="98.6"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Respiratory Rate
                </label>
                <input
                  type="number"
                  value={vitals.respiratoryRate || ''}
                  onChange={(e) => handleChange('respiratoryRate', parseInt(e.target.value) || 0)}
                  placeholder="16"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  O2 Saturation (%)
                </label>
                <input
                  type="number"
                  value={vitals.oxygenSaturation || ''}
                  onChange={(e) => handleChange('oxygenSaturation', parseInt(e.target.value) || 0)}
                  placeholder="98"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={vitals.weight || ''}
                  onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                  placeholder="150"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Height (in)
                </label>
                <input
                  type="number"
                  value={vitals.height || ''}
                  onChange={(e) => handleChange('height', parseFloat(e.target.value) || 0)}
                  placeholder="68"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Save Vital Signs
          </button>

          {/* Additional Context Sections */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Chief Complaint</h4>
            <textarea
              placeholder="Enter chief complaint..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Medical History</h4>
            <textarea
              placeholder="Enter relevant medical history..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Medications</h4>
            <textarea
              placeholder="List current medications..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
