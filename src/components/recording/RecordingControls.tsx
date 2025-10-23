import React, { useState, useEffect } from 'react';
import { RecordingState } from '../../models/types';
import { formatDuration } from '../../utils/transformations';

interface RecordingControlsProps {
  recordingState: RecordingState;
  onStart: () => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onStop: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>) => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getMainButtonConfig = () => {
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

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
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
              className="bg-green-500 h-2 rounded-full transition-all duration-150"
              style={{ width: `${recordingState.audioLevel * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Recording Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
    </div>
  );
};

// Keyboard shortcuts hook
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