import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  timeRemaining,
  onExtend,
  onLogout
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">
            Session Timeout Warning
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Your session will expire due to inactivity. Any unsaved work may be lost.
          </p>
          
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-2xl font-mono font-bold text-red-600">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onExtend}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue Session
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};