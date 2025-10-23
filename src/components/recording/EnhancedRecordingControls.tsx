import React, { useState, useEffect } from 'react';
import { RecordingState } from '../../models/types';
import { formatDuration } from '../../utils/transformations';
import type { PermissionState, RecordingError, AudioDevice } from '../../utils/types';

interface EnhancedRecordingControlsProps {
  recordingState: RecordingState;
  onStart: () => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onStop: () => Promise<void>;
  disabled?: boolean;
  className?: string;
  
  // Enhanced features
  permissionState?: PermissionState;
  onRequestPermission?: () => Promise<void>;
  error?: RecordingError | null;
  onRetry?: () => Promise<void>;
  onDismissError?: () => void;
  onRunDiagnostics?: () => Promise<void>;
  availableDevices?: AudioDevice[];
  selectedDevice?: AudioDevice | null;
  onSelectDevice?: (deviceId: string) => Promise<void>;
}

export const EnhancedRecordingControls: React.FC<EnhancedRecordingControlsProps> = ({
  recordingState,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
  className = '',
  permissionState = 'unknown',
  onRequestPermission,
  error,
  onRetry,
  onDismissError,
  onRunDiagnostics,
  availableDevices = [],
  selectedDevice,
  onSelectDevice
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || (localError ? {
    code: 'LOCAL_ERROR',
    message: localError,
    userMessage: localError,
    canRetry: false,
    canRecover: true
  } as RecordingError : null);

  const handleAction = async (action: () => Promise<void>) => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      await action();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    if (onSelectDevice) {
      setIsLoading(true);
      try {
        await onSelectDevice(deviceId);
        setShowDeviceSelector(false);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Failed to change device');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getMainButtonConfig = () => {
    // Permission not granted
    if (permissionState !== 'granted' && !recordingState.isRecording) {
      return {
        label: 'Request Permission',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        action: () => handleAction(onRequestPermission || onStart),
        className: 'bg-blue-600 hover:bg-blue-700 text-white',
        pulseClass: ''
      };
    }

    if (!recordingState.isRecording) {
      return {
        label: 'Start Recording',
        icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        ),
        action: () => handleAction(onStart),
        className: 'bg-red-600 hover:bg-red-700 text-white',
        pulseClass: ''
      };
    }

    if (recordingState.isPaused) {
      return {
        label: 'Resume',
        icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ),
        action: () => handleAction(onResume),
        className: 'bg-green-600 hover:bg-green-700 text-white',
        pulseClass: ''
      };
    }

    return {
      label: 'Pause',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      ),
      action: () => handleAction(onPause),
      className: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      pulseClass: 'animate-pulse'
    };
  };

  const mainButton = getMainButtonConfig();

  // Permission status indicator
  const getPermissionIndicator = () => {
    switch (permissionState) {
      case 'granted':
        return (
          <div className="flex items-center text-green-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Microphone Ready
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center text-red-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Permission Denied
          </div>
        );
      case 'prompt':
        return (
          <div className="flex items-center text-yellow-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Permission Required
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Permission status */}
      <div className="flex items-center justify-center mb-4">
        {getPermissionIndicator()}
      </div>

      {/* Recording status indicator */}
      <div className="flex items-center justify-center mb-4">
        {recordingState.isRecording && (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 bg-red-500 rounded-full ${recordingState.isPaused ? '' : 'animate-pulse'}`} />
            <span className="text-sm font-medium text-gray-700">
              {recordingState.isPaused ? 'Recording Paused' : 'Recording Active'}
            </span>
          </div>
        )}
      </div>

      {/* Duration display */}
      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-bold text-gray-900">
          {formatDuration(recordingState.duration)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Duration
        </div>
      </div>

      {/* Audio level indicator */}
      {recordingState.isRecording && !recordingState.isPaused && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Audio Level</span>
            <span>{Math.round(recordingState.audioLevel * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-150 ${
                recordingState.audioLevel < 0.1 ? 'bg-red-500' :
                recordingState.audioLevel < 0.3 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(recordingState.audioLevel * 100, 100)}%` }}
            />
          </div>
          {recordingState.audioLevel < 0.1 && (
            <p className="text-xs text-red-600 mt-1">Low audio level detected</p>
          )}
        </div>
      )}

      {/* Device selector */}
      {availableDevices.length > 1 && !recordingState.isRecording && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Microphone
          </label>
          <div className="relative">
            <button
              onClick={() => setShowDeviceSelector(!showDeviceSelector)}
              className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={disabled || isLoading}
            >
              <span className="block truncate">
                {selectedDevice?.label || 'Select microphone...'}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            
            {showDeviceSelector && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {availableDevices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleDeviceChange(device.deviceId)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                      selectedDevice?.deviceId === device.deviceId ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{device.label}</span>
                      {device.isDefault && (
                        <span className="ml-2 text-xs text-gray-500">(Default)</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {displayError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">{displayError.userMessage}</h3>
              {displayError.resolution && (
                <p className="text-sm text-red-700 mt-1">{displayError.resolution}</p>
              )}
              <div className="mt-2 flex space-x-3">
                {displayError.canRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-sm text-red-800 underline hover:text-red-900"
                  >
                    Retry
                  </button>
                )}
                {onDismissError && (
                  <button
                    onClick={onDismissError}
                    className="text-sm text-red-800 underline hover:text-red-900"
                  >
                    Dismiss
                  </button>
                )}
                {onRunDiagnostics && (
                  <button
                    onClick={onRunDiagnostics}
                    className="text-sm text-red-800 underline hover:text-red-900"
                  >
                    Diagnostics
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center justify-center space-x-4">
        {/* Main action button */}
        <button
          onClick={mainButton.action}
          disabled={disabled || isLoading}
          className={`
            relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-200 transform
            ${mainButton.className}
            ${mainButton.pulseClass}
            ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          `}
          aria-label={mainButton.label}
        >
          {isLoading ? (
            <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            mainButton.icon
          )}
        </button>

        {/* Stop button (only show when recording) */}
        {recordingState.isRecording && (
          <button
            onClick={() => handleAction(onStop)}
            disabled={disabled || isLoading}
            className={`
              flex items-center justify-center w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200 transform
              ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
            `}
            aria-label="Stop recording"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Button labels */}
      <div className="flex items-center justify-center mt-4 space-x-8">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">{mainButton.label}</div>
        </div>
        {recordingState.isRecording && (
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">Stop</div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center space-x-4">
            <span>Space: Start/Pause</span>
            <span>Esc: Stop</span>
          </div>
        </div>
      </div>

      {/* Diagnostics button */}
      {onRunDiagnostics && (
        <div className="mt-3 text-center">
          <button
            onClick={onRunDiagnostics}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Run Diagnostics
          </button>
        </div>
      )}
    </div>
  );
};

// Keyboard shortcuts hook (enhanced version)
export const useRecordingKeyboardShortcuts = (
  recordingState: RecordingState,
  onStart: () => void,
  onPause: () => void,
  onResume: () => void,
  onStop: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (!recordingState.isRecording) {
            onStart();
          } else if (recordingState.isPaused) {
            onResume();
          } else {
            onPause();
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (recordingState.isRecording) {
            onStop();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [recordingState, onStart, onPause, onResume, onStop, enabled]);
};
