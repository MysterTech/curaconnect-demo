import React, { useState } from 'react';
import { DiagnosticReport } from '../../services/RecordingController';

interface RecordingDiagnosticsProps {
  isOpen: boolean;
  diagnosticReport: DiagnosticReport | null;
  onClose: () => void;
  onRunTest: () => Promise<void>;
  onCopyReport: () => void;
}

export const RecordingDiagnostics: React.FC<RecordingDiagnosticsProps> = ({
  isOpen,
  diagnosticReport,
  onClose,
  onRunTest,
  onCopyReport
}) => {
  const [isRunningTest, setIsRunningTest] = useState(false);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsRunningTest(true);
    try {
      await onRunTest();
    } finally {
      setIsRunningTest(false);
    }
  };

  const renderStatusIcon = (supported: boolean) => {
    if (supported) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recording Diagnostics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!diagnosticReport ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No diagnostic report available</p>
              <button
                onClick={handleRunTest}
                disabled={isRunningTest}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isRunningTest ? 'Running Test...' : 'Run Diagnostic Test'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Browser Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Browser Information</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-700">Browser:</dt>
                    <dd className="text-gray-900">{diagnosticReport.deviceInfo.browserInfo.name} {diagnosticReport.deviceInfo.browserInfo.version}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Platform:</dt>
                    <dd className="text-gray-900">{diagnosticReport.deviceInfo.browserInfo.platform}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Compatible:</dt>
                    <dd className="text-gray-900">
                      {diagnosticReport.browserSupport.isCompatible ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Permission:</dt>
                    <dd className="text-gray-900 capitalize">{diagnosticReport.permissionState}</dd>
                  </div>
                </dl>
              </div>

              {/* API Support */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">API Support</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">getUserMedia</span>
                    {renderStatusIcon(diagnosticReport.deviceInfo.apiSupport.getUserMedia)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">MediaRecorder</span>
                    {renderStatusIcon(diagnosticReport.deviceInfo.apiSupport.mediaRecorder)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">AudioContext</span>
                    {renderStatusIcon(diagnosticReport.deviceInfo.apiSupport.audioContext)}
                  </div>
                </div>
              </div>

              {/* Audio Devices */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Audio Devices</h3>
                {diagnosticReport.deviceInfo.availableDevices.length > 0 ? (
                  <ul className="space-y-2">
                    {diagnosticReport.deviceInfo.availableDevices.map((device, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-900">{device.label || `Device ${index + 1}`}</span>
                        {device.deviceId === diagnosticReport.deviceInfo.currentDevice?.deviceId && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Current</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No audio devices found</p>
                )}
              </div>

              {/* Supported MIME Types */}
              {diagnosticReport.deviceInfo.supportedMimeTypes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Supported Audio Formats</h3>
                  <div className="flex flex-wrap gap-2">
                    {diagnosticReport.deviceInfo.supportedMimeTypes.map((type, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {diagnosticReport.recommendations.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-yellow-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {diagnosticReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-center">
                Report generated: {diagnosticReport.timestamp.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleRunTest}
            disabled={isRunningTest}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isRunningTest ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Test...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Run Test Again
              </>
            )}
          </button>
          <div className="flex space-x-3">
            {diagnosticReport && (
              <button
                onClick={onCopyReport}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Report
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
