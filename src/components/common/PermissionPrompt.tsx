import React, { useState } from 'react';
import { PermissionState, PermissionInstructions } from '../../services/PermissionManager';

interface PermissionPromptProps {
  isOpen: boolean;
  permissionState: PermissionState;
  onRequestPermission: () => Promise<void>;
  onClose: () => void;
  instructions?: PermissionInstructions;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  isOpen,
  permissionState,
  onRequestPermission,
  onClose,
  instructions
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(null);
    
    try {
      await onRequestPermission();
      // If successful, close the modal
      if (permissionState === 'granted') {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
    } finally {
      setIsRequesting(false);
    }
  };

  const renderContent = () => {
    if (permissionState === 'denied' && instructions) {
      return (
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
            Microphone Access Denied
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              You've previously denied microphone access. To use recording features, you'll need to manually grant permission in your browser settings.
            </p>
            <div className="mt-4 bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                How to enable microphone access in {instructions.browser}:
              </h4>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
          Microphone Access Required
        </h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            This application needs access to your microphone to record audio for medical transcription. 
            Your browser will ask for permission to use your microphone.
          </p>
          <div className="mt-4 bg-blue-50 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  <strong>Privacy Note:</strong> Audio is processed locally in your browser and only sent to OpenAI's API for transcription. No audio is stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="text-center">
            {renderContent()}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-6 flex space-x-3 justify-center">
              {permissionState !== 'denied' && (
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className={`
                    px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm
                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${isRequesting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isRequesting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Requesting...
                    </span>
                  ) : (
                    'Allow Microphone Access'
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {permissionState === 'denied' ? 'Close' : 'Cancel'}
              </button>
            </div>

            {permissionState === 'denied' && (
              <p className="mt-4 text-xs text-gray-500">
                After updating your browser settings, please refresh this page.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
