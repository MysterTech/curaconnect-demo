import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { EyeExamData } from '../models/types';

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
  eyeExam?: EyeExamData;
  onVitalSignsUpdate: (vitals: VitalSigns) => void;
  onEyeExamUpdate?: (eyeExam: EyeExamData) => void;
}

export const ContextView: React.FC<ContextViewProps> = ({
  vitalSigns,
  eyeExam,
  onVitalSignsUpdate,
  onEyeExamUpdate
}) => {
  const [vitals, setVitals] = useState<VitalSigns>(vitalSigns);
  const [eyeExamData, setEyeExamData] = useState<EyeExamData>(eyeExam || {});
  const { showToast } = useToast();

  useEffect(() => {
    setVitals(vitalSigns);
  }, [vitalSigns]);

  useEffect(() => {
    setEyeExamData(eyeExam || {});
  }, [eyeExam]);

  const handleSave = () => {
    onVitalSignsUpdate(vitals);
    if (onEyeExamUpdate) {
      onEyeExamUpdate(eyeExamData);
    }
    showToast('Patient context saved successfully!', 'success');
  };

  const handleChange = (field: keyof VitalSigns, value: string | number) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const handleEyeExamChange = (path: string[], value: string) => {
    setEyeExamData(prev => {
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newData;
    });
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

          {/* Eye Examination Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Eye Examination</h4>

            {/* Visual Acuity */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Visual Acuity</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    value={eyeExamData.visualAcuity?.left || ''}
                    onChange={(e) => handleEyeExamChange(['visualAcuity', 'left'], e.target.value)}
                    placeholder="Left (e.g., 20/20)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={eyeExamData.visualAcuity?.right || ''}
                    onChange={(e) => handleEyeExamChange(['visualAcuity', 'right'], e.target.value)}
                    placeholder="Right (e.g., 20/25)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={eyeExamData.visualAcuity?.both || ''}
                    onChange={(e) => handleEyeExamChange(['visualAcuity', 'both'], e.target.value)}
                    placeholder="Both (e.g., 20/20)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Intraocular Pressure */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Intraocular Pressure</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={eyeExamData.intraocularPressure?.left || ''}
                    onChange={(e) => handleEyeExamChange(['intraocularPressure', 'left'], e.target.value)}
                    placeholder="Left (e.g., 15 mmHg)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={eyeExamData.intraocularPressure?.right || ''}
                    onChange={(e) => handleEyeExamChange(['intraocularPressure', 'right'], e.target.value)}
                    placeholder="Right (e.g., 16 mmHg)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Pupils */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Pupils</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={eyeExamData.pupils?.left || ''}
                    onChange={(e) => handleEyeExamChange(['pupils', 'left'], e.target.value)}
                    placeholder="Left (e.g., PERRLA)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={eyeExamData.pupils?.right || ''}
                    onChange={(e) => handleEyeExamChange(['pupils', 'right'], e.target.value)}
                    placeholder="Right (e.g., PERRLA)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Extraocular Movements */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Extraocular Movements</label>
              <input
                type="text"
                value={eyeExamData.extraocularMovements || ''}
                onChange={(e) => handleEyeExamChange(['extraocularMovements'], e.target.value)}
                placeholder="e.g., Full in all directions"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Confrontation Fields */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Confrontation Fields</label>
              <input
                type="text"
                value={eyeExamData.confrontationFields || ''}
                onChange={(e) => handleEyeExamChange(['confrontationFields'], e.target.value)}
                placeholder="e.g., Full to confrontation"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Slit Lamp Exam */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Slit Lamp Exam</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={eyeExamData.slitLampExam?.anteriorSegment || ''}
                  onChange={(e) => handleEyeExamChange(['slitLampExam', 'anteriorSegment'], e.target.value)}
                  placeholder="Anterior Segment"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={eyeExamData.slitLampExam?.lens || ''}
                  onChange={(e) => handleEyeExamChange(['slitLampExam', 'lens'], e.target.value)}
                  placeholder="Lens"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={eyeExamData.slitLampExam?.cornea || ''}
                  onChange={(e) => handleEyeExamChange(['slitLampExam', 'cornea'], e.target.value)}
                  placeholder="Cornea"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Fundus Exam */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Fundus Exam</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={eyeExamData.fundusExam?.opticDisc || ''}
                  onChange={(e) => handleEyeExamChange(['fundusExam', 'opticDisc'], e.target.value)}
                  placeholder="Optic Disc"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={eyeExamData.fundusExam?.macula || ''}
                  onChange={(e) => handleEyeExamChange(['fundusExam', 'macula'], e.target.value)}
                  placeholder="Macula"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={eyeExamData.fundusExam?.vessels || ''}
                  onChange={(e) => handleEyeExamChange(['fundusExam', 'vessels'], e.target.value)}
                  placeholder="Vessels"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={eyeExamData.fundusExam?.periphery || ''}
                  onChange={(e) => handleEyeExamChange(['fundusExam', 'periphery'], e.target.value)}
                  placeholder="Periphery"
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
            Save Patient Context
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
