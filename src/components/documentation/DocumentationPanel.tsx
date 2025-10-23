import React, { useState } from 'react';
import { ClinicalDocumentation, SOAPNote } from '../../models/types';

interface DocumentationPanelProps {
  documentation: ClinicalDocumentation;
  isLive?: boolean;
  isEditable?: boolean;
  onUpdate?: (documentation: Partial<ClinicalDocumentation>) => void;
  className?: string;
}

interface SOAPSectionProps {
  title: string;
  content: string;
  isEditable: boolean;
  onUpdate?: (content: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const SOAPSection: React.FC<SOAPSectionProps> = ({
  title,
  content,
  isEditable,
  onUpdate,
  placeholder,
  icon
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSave = () => {
    onUpdate?.(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-indigo-600">{icon}</div>}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isEditable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-vertical"
            autoFocus
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          {content ? (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <p className="text-gray-400 italic">{placeholder || 'No content yet...'}</p>
          )}
        </div>
      )}
    </div>
  );
};

const VitalSignsSection: React.FC<{
  vitalSigns?: any;
  isEditable: boolean;
  onUpdate?: (vitals: any) => void;
}> = ({ vitalSigns = {}, isEditable, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editVitals, setEditVitals] = useState(vitalSigns);

  const handleSave = () => {
    onUpdate?.(editVitals);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditVitals(vitalSigns);
    setIsEditing(false);
  };

  const vitalFields = [
    { key: 'bloodPressure', label: 'Blood Pressure', placeholder: '120/80' },
    { key: 'heartRate', label: 'Heart Rate', placeholder: '72', unit: 'bpm' },
    { key: 'temperature', label: 'Temperature', placeholder: '98.6', unit: '°F' },
    { key: 'respiratoryRate', label: 'Respiratory Rate', placeholder: '16', unit: '/min' },
    { key: 'oxygenSaturation', label: 'O2 Saturation', placeholder: '98', unit: '%' }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Vital Signs</h3>
        </div>
        {isEditable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vitalFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editVitals[field.key] || ''}
                    onChange={(e) => setEditVitals({
                      ...editVitals,
                      [field.key]: e.target.value
                    })}
                    placeholder={field.placeholder}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {field.unit && (
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {field.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vitalFields.map((field) => (
            <div key={field.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">{field.label}:</span>
              <span className="text-sm text-gray-900">
                {vitalSigns[field.key] ? `${vitalSigns[field.key]}${field.unit || ''}` : '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const DocumentationPanel: React.FC<DocumentationPanelProps> = ({
  documentation,
  isLive = false,
  isEditable = true,
  onUpdate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'soap' | 'entities' | 'summary'>('soap');

  const handleSOAPUpdate = (section: keyof SOAPNote, content: any) => {
    const updatedSOAP = {
      ...documentation.soapNote,
      [section]: typeof content === 'string' ? { ...documentation.soapNote[section], [Object.keys(documentation.soapNote[section])[0]]: content } : content
    };
    
    onUpdate?.({
      soapNote: updatedSOAP,
      lastUpdated: new Date()
    });
  };

  const tabs = [
    { id: 'soap', label: 'SOAP Note', icon: '📋' },
    { id: 'entities', label: 'Clinical Entities', icon: '🏷️' },
    { id: 'summary', label: 'Summary', icon: '📄' }
  ];

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Clinical Documentation</h3>
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Auto-updating</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {documentation.isFinalized && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Finalized
            </span>
          )}
          <span className="text-sm text-gray-500">
            Updated {documentation.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'soap' && (
          <div className="space-y-4">
            {/* Subjective */}
            <SOAPSection
              title="Subjective"
              content={documentation.soapNote.subjective.chiefComplaint || ''}
              isEditable={isEditable}
              onUpdate={(content) => handleSOAPUpdate('subjective', { chiefComplaint: content })}
              placeholder="Chief complaint and history of present illness..."
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />

            {/* Vital Signs */}
            <VitalSignsSection
              vitalSigns={documentation.soapNote.objective.vitalSigns}
              isEditable={isEditable}
              onUpdate={(vitals) => handleSOAPUpdate('objective', { vitalSigns: vitals })}
            />

            {/* Objective */}
            <SOAPSection
              title="Physical Examination"
              content={documentation.soapNote.objective.physicalExam || ''}
              isEditable={isEditable}
              onUpdate={(content) => handleSOAPUpdate('objective', { physicalExam: content })}
              placeholder="Physical examination findings..."
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />

            {/* Assessment */}
            <SOAPSection
              title="Assessment"
              content={documentation.soapNote.assessment.diagnoses.join('\n')}
              isEditable={isEditable}
              onUpdate={(content) => handleSOAPUpdate('assessment', { diagnoses: content.split('\n').filter(d => d.trim()) })}
              placeholder="Primary and secondary diagnoses..."
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {/* Plan */}
            <SOAPSection
              title="Plan"
              content={documentation.soapNote.plan.patientInstructions || ''}
              isEditable={isEditable}
              onUpdate={(content) => handleSOAPUpdate('plan', { patientInstructions: content })}
              placeholder="Treatment plan and patient instructions..."
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
          </div>
        )}

        {activeTab === 'entities' && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Clinical Entities</h4>
            {documentation.clinicalEntities.length === 0 ? (
              <p className="text-gray-500 italic">No clinical entities extracted yet...</p>
            ) : (
              <div className="space-y-2">
                {documentation.clinicalEntities.map((entity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                        entity.type === 'medication' ? 'bg-blue-100 text-blue-800' :
                        entity.type === 'diagnosis' ? 'bg-red-100 text-red-800' :
                        entity.type === 'symptom' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entity.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{entity.value}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(entity.confidence * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Session Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Documentation Status</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Finalized:</span>
                    <span className={documentation.isFinalized ? 'text-green-600' : 'text-yellow-600'}>
                      {documentation.isFinalized ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entities:</span>
                    <span>{documentation.clinicalEntities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{documentation.lastUpdated.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};