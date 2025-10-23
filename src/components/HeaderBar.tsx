import React, { useState } from 'react';

interface HeaderBarProps {
  patientDetails: string;
  onPatientDetailsChange: (details: string) => void;
  onResume: () => void;
  isRecording: boolean;
  duration: string;
  onToggleRecording: () => void;
  onUploadAudio: (file: File) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  patientDetails,
  onPatientDetailsChange,
  onResume,
  isRecording,
  duration,
  onToggleRecording,
  onUploadAudio,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(patientDetails);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleSave = () => {
    onPatientDetailsChange(editValue);
    setIsEditing(false);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `Today ${time}`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input changed, files:', event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log('📄 File selected:', file.name, file.type, file.size);
      
      // Validate file type
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|webm|ogg|m4a)$/i)) {
        console.warn('⚠️ Invalid file type:', file.type);
        alert('Please upload a valid audio file (WAV, MP3, WebM, OGG, or M4A)');
        return;
      }
      
      console.log('✅ File validated, calling onUploadAudio...');
      onUploadAudio(file);
      setShowDropdown(false);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    console.log('🖱️ Upload button clicked');
    console.log('📎 File input ref:', fileInputRef.current);
    fileInputRef.current?.click();
    setShowDropdown(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Patient Details */}
        <div className="flex items-center space-x-4">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add patient details"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{patientDetails || 'Add patient details'}</span>
            </button>
          )}
          
          <span className="text-sm text-gray-500">{getCurrentDateTime()}</span>
          
          <button className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 flex items-center space-x-1">
            <span>🌐</span>
            <span>English</span>
          </button>
          
          <span className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded">
            14 days
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          {/* Recording Button with Dropdown */}
          {isRecording ? (
            <button
              onClick={onToggleRecording}
              className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-lg transition-all"
            >
              <div className="w-3 h-3 bg-white rounded-sm"></div>
              <div className="flex flex-col items-start">
                <span>Stop Recording</span>
                <span className="text-xs opacity-90">{duration}</span>
              </div>
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <div className="flex">
                <button
                  onClick={onToggleRecording}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-l-lg text-sm font-medium hover:bg-green-700 shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Start Recording</span>
                </button>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-3 py-2.5 bg-green-600 text-white rounded-r-lg text-sm font-medium hover:bg-green-700 border-l border-green-500 shadow-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px]">
                  <button
                    onClick={handleUploadClick}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 text-sm text-gray-700"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <div className="font-medium">Upload Audio</div>
                      <div className="text-xs text-gray-500">WAV, MP3, WebM, OGG, M4A</div>
                    </div>
                  </button>
                </div>
              )}
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
          
          <button
            onClick={onResume}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
};
