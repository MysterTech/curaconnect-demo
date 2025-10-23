import React, { useState } from 'react';
import { userSettingsService, UserSettings } from '../services/UserSettingsService';
import { SPECIALTY_LABELS, MedicalSpecialty, getTemplatesBySpecialty } from '../models/templates';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(userSettingsService.getSettings());
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'account' | 'billing' | 'memory' | 'display' | 'data' | 'defaults' | 'notifications' | 'Saboo-labs'>('account');

  const handleSave = () => {
    userSettingsService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const templates = getTemplatesBySpecialty(settings.specialty);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Settings</h2>
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="p-2">
          <div className="text-xs font-medium text-gray-500 px-3 py-2">Personal</div>
          <button
            onClick={() => setActiveSection('account')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center space-x-2 ${
              activeSection === 'account' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Account</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">About you</h1>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Profile image</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {settings.name ? settings.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AS'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Upload a JPG or PNG image up to 5MB. Shows in the template community.</p>
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Upload image</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <select
                    value={settings.credentials.split(' ')[0] || 'Dr'}
                    onChange={(e) => {
                      const title = e.target.value;
                      const rest = settings.credentials.split(' ').slice(1).join(' ');
                      setSettings({ ...settings, credentials: `${title} ${rest}`.trim() });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a title</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    value={settings.name.split(' ')[0] || ''}
                    onChange={(e) => {
                      const firstName = e.target.value;
                      const lastName = settings.name.split(' ').slice(1).join(' ');
                      setSettings({ ...settings, name: `${firstName} ${lastName}`.trim() });
                    }}
                    placeholder="Abc"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={settings.name.split(' ').slice(1).join(' ') || ''}
                    onChange={(e) => {
                      const firstName = settings.name.split(' ')[0] || '';
                      const lastName = e.target.value;
                      setSettings({ ...settings, name: `${firstName} ${lastName}`.trim() });
                    }}
                    placeholder="S"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty
                </label>
                <select
                  value={settings.specialty}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    specialty: e.target.value as MedicalSpecialty,
                    defaultTemplate: null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select specialty</option>
                  
                  <optgroup label="Physician">
                    <option value="addiction-medicine">Addiction Medicine</option>
                    <option value="anaesthetics">Anaesthetics</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="emergency-medicine">Emergency Medicine</option>
                    <option value="endocrinology">Endocrinology</option>
                    <option value="gastroenterology">Gastroenterology</option>
                    <option value="general-medicine">General Medicine</option>
                    <option value="general-practice">General Practice</option>
                    <option value="general-practitioner">General Practitioner</option>
                    <option value="genetics">Genetics</option>
                    <option value="geriatric-medicine">Geriatric Medicine</option>
                    <option value="haematology">Haematology</option>
                    <option value="icu">ICU</option>
                    <option value="immunology-allergy">Immunology & Allergy</option>
                    <option value="infectious-disease">Infectious Disease</option>
                    <option value="medical-admin">Medical Admin</option>
                    <option value="nephrology">Nephrology</option>
                    <option value="neurology">Neurology</option>
                    <option value="nuclear-medicine">Nuclear Medicine</option>
                    <option value="occupational-medicine">Occupational Medicine</option>
                    <option value="oncology">Oncology</option>
                    <option value="paediatrics">Paediatrics</option>
                    <option value="pediatrician">Pediatrician</option>
                    <option value="pain-medicine">Pain Medicine</option>
                    <option value="palliative-care">Palliative Care</option>
                    <option value="pathology">Pathology</option>
                    <option value="pharmacology">Pharmacology</option>
                    <option value="physician-other">Physician - Other</option>
                    <option value="psychiatry">Psychiatry</option>
                    <option value="public-health">Public Health</option>
                    <option value="radiation-oncology">Radiation Oncology</option>
                    <option value="radiology">Radiology</option>
                    <option value="rehab-medicine">Rehab Medicine</option>
                    <option value="respiratory">Respiratory</option>
                    <option value="rheumatology">Rheumatology</option>
                    <option value="sexual-health-medicine">Sexual Health Medicine</option>
                  </optgroup>
                  
                  <optgroup label="Surgeon">
                    <option value="cardiothoracic">Cardiothoracic</option>
                    <option value="ear-nose-throat">Ear Nose and Throat</option>
                    <option value="general-surgery">General Surgery</option>
                    <option value="maxillofacial-surgery">Maxillofacial Surgery</option>
                    <option value="neurosurgery">Neurosurgery</option>
                    <option value="obstetrics-gynaecology">Obstetrics and Gynaecology</option>
                    <option value="gynecologist">Gynecologist / Obstetrician</option>
                    <option value="ophthalmology">Ophthalmology</option>
                    <option value="orthopaedic">Orthopaedic</option>
                    <option value="paediatric-surgery">Paediatric Surgery</option>
                    <option value="plastics">Plastics</option>
                    <option value="urology">Urology</option>
                    <option value="vascular">Vascular</option>
                  </optgroup>
                  
                  <optgroup label="Allied Health">
                    <option value="audiology">Audiology</option>
                    <option value="ayurveda">Ayurveda Practitioner</option>
                    <option value="chinese-medicine">Chinese Medicine</option>
                    <option value="dentist">Dentist</option>
                    <option value="sports-exercise-medicine">Sports & Exercise Medicine</option>
                  </optgroup>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  This determines which note templates are available to you
                </p>
              </div>

              {/* Organization Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisation name
                  </label>
                  <input
                    type="text"
                    value={settings.clinicName}
                    onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                    placeholder="test"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company size
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Just me</option>
                    <option>2-10 people</option>
                    <option>11-50 people</option>
                    <option>51-200 people</option>
                    <option>201+ people</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your role
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Individual clinician</option>
                    <option>Practice Manager</option>
                    <option>Administrator</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value="Australia"
                    disabled
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-400">Why can't I change this?</span>
                </div>
                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 inline-block">
                  Privacy Policy for my country →
                </a>
              </div>

          {/* Default Template */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Note Template</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select default template for new sessions
              </label>
              <select
                value={settings.defaultTemplate || ''}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  defaultTemplate: e.target.value || null 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No default (select each time)</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Available templates for {SPECIALTY_LABELS[settings.specialty]}
              </p>
            </div>
          </div>

          {/* Available Templates Preview */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Templates</h2>
            <div className="space-y-2">
              {templates.map((template) => (
                <div 
                  key={template.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                    {settings.defaultTemplate === template.id && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                {saved && (
                  <span className="text-green-600 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Settings saved successfully
                  </span>
                )}
              </div>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Available Templates Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Available Templates</h2>
              <p className="text-sm text-gray-600 mt-1">
                Templates available for {SPECIALTY_LABELS[settings.specialty]}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {template.sections.slice(0, 4).map((section) => (
                            <span key={section.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {section.title}
                            </span>
                          ))}
                          {template.sections.length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{template.sections.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setSettings({ ...settings, defaultTemplate: template.id })}
                          className={`px-3 py-1.5 text-sm rounded-lg border ${
                            settings.defaultTemplate === template.id
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {settings.defaultTemplate === template.id ? '✓ Default' : 'Set as default'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
