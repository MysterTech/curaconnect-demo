import React from 'react';

interface RecordingButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  duration?: string;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onToggle,
  duration = '00:00',
}) => {
  return (
    <div className="fixed bottom-24 right-8 z-50">
      <button
        onClick={onToggle}
        className={`
          group relative flex items-center space-x-3 px-6 py-4 rounded-full shadow-lg
          transition-all duration-200 transform hover:scale-105
          ${isRecording 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }
        `}
      >
        {isRecording ? (
          <>
            <div className="w-4 h-4 bg-white rounded-sm animate-pulse"></div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Recording</span>
              <span className="text-xs opacity-90">{duration}</span>
            </div>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm font-medium">Start Recording</span>
          </>
        )}
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {isRecording ? 'Click to stop recording' : 'Click to start recording'}
      </div>
    </div>
  );
};
