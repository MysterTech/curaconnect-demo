import React from 'react';
import type { DiagnosticReport } from '../../utils/types';

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
  const [isRunning, setIsRunning] = React.useState(false);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      await onRunTest();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white mb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recording Diagnostics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Test...' : 'Run Test'}
          </button>
          {diagnosticReport && (
            <button
              onClick={onCopyReport}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
            >
              Copy Report
            </button>
          )}
        </div>

        {/* Diagnostic Report */}
        {diagnosticReport ? (
          <div className="space-y-6">
            {/* Browser Support */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Browser Support</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Overall Status:</span>
                  <span className={`text-sm font-medium ${
                    diagnosticReport.browserSupport.supported ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {diagnosticReport.browserSupport.supported ? '✓ Supported' : '✗ Not Supported'}
                  </span>
                </div>
                {diagnosticReport.browserSupport.missingFeatures.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-700">Missing Features:</span>
                    <ul className="list-disc list-inside ml-4 text-sm text-red-600">
                {diagnosticReport.browserSupport.missingFeatures.map((feature: string) => (
                  <li key={feature}>{feature}</li>
                ))}
                    </ul>
                  </div>
                )}
                {diagnosticReport.browserSupport.warnings.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-700">Warnings:</span>
                    <ul className="list-disc list-inside ml-4 text-sm text-yellow-600">
                {diagnosticReport.browserSupport.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Browser Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Browser Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{diagnosticReport.deviceInfo.browserInfo.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Version:</span>
                  <span className="ml-2 font-medium">{diagnosticReport.deviceInfo.browserInfo.version}</span>
                </div>
                <div>
                  <span className="text-gray-600">Platform:</span>
                  <span className="ml-2 font-medium">{diagnosticReport.deviceInfo.browserInfo.platform}</span>
                </div>
              </div>
            </div>

            {/* API Support */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">API Support</h4>
              <div className="space-y-2">
                {Object.entries(diagnosticReport.deviceInfo.apiSupport).map(([api, supported]) => (
                  <div key={api} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{api}:</span>
                    <span className={`text-sm font-medium ${supported ? 'text-green-600' : 'text-red-600'}`}>
                      {supported ? '✓ Supported' : '✗ Not Supported'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Permission Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Permission Status</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Microphone Permission:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  diagnosticReport.permissionState === 'granted' ? 'bg-green-100 text-green-800' :
                  diagnosticReport.permissionState === 'denied' ? 'bg-red-100 text-red-800' :
                  diagnosticReport.permissionState === 'prompt' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {diagnosticReport.permissionState}
                </span>
              </div>
            </div>

            {/* Available Devices */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Available Devices</h4>
              {diagnosticReport.deviceInfo.availableDevices.length > 0 ? (
                <ul className="space-y-2">
                  {diagnosticReport.deviceInfo.availableDevices.map((device: MediaDeviceInfo, index: number) => (
                    <li key={device.deviceId || index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">
                          {device.label || `Microphone ${index + 1}`}
                        </span>
                        {diagnosticReport.deviceInfo.currentDevice?.deviceId === device.deviceId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No audio input devices found</p>
              )}
            </div>

            {/* Recommendations */}
            {diagnosticReport.recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {diagnosticReport.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="text-sm text-blue-800">{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center">
              Report generated: {diagnosticReport.timestamp.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">
              No diagnostic report available. Click "Run Test" to generate one.
            </p>
          </div>
        )}

        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
