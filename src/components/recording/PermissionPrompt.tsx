import React from 'react';
import type { PermissionState, PermissionInstructions } from '../../utils/types';

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
  if (!isOpen) return null;

  const [isRequesting, setIsRequesting] = React.useState(false);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mt-4">
            Microphone Permission Required
          </h3>

          {/* Content */}
          <div className="mt-4 px-4">
            {permissionState === 'prompt' && (
              <p className="text-sm text-gray-500 text-center">
                MedScribe needs access to your microphone to record audio for transcription.
                Click the button below to grant permission.
              </p>
            )}

            {permissionState === 'denied' && instructions && (
              <div className="text-sm text-gray-700">
                <p className="mb-3 text-center font-medium">
                  Microphone access was denied. Please follow these steps to enable it:
                </p>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="font-medium mb-2">{instructions.browser}:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {instructions.steps.map((step, index) => (
                      <li key={index} className="text-sm">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {permissionState === 'granted' && (
              <p className="text-sm text-green-600 text-center">
                ✓ Microphone permission granted! You can now start recording.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex space-x-3 px-4">
            {permissionState === 'prompt' && (
              <>
                <button
                  onClick={handleRequest}
                  disabled={isRequesting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequesting ? 'Requesting...' : 'Grant Permission'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </>
            )}

            {permissionState === 'denied' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                I've Updated Permissions
              </button>
            )}

            {permissionState === 'granted' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Continue
              </button>
            )}
          </div>

          {/* Help text */}
          <div className="mt-4 px-4">
            <p className="text-xs text-gray-500 text-center">
              Your audio is processed locally and securely. We never store or transmit your recordings without your explicit consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
