import React from 'react';
import type { CompatibilityResult } from '../../utils/types';

interface BrowserCompatibilityWarningProps {
  compatibilityResult: CompatibilityResult;
  onDismiss: () => void;
  onViewDetails: () => void;
}

export const BrowserCompatibilityWarning: React.FC<BrowserCompatibilityWarningProps> = ({
  compatibilityResult,
  onDismiss,
  onViewDetails
}) => {
  if (compatibilityResult.isCompatible && compatibilityResult.warnings.length === 0) {
    return null;
  }

  const severity = compatibilityResult.isCompatible ? 'warning' : 'error';

  return (
    <div className={`rounded-md p-4 ${
      severity === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {severity === 'error' ? (
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${
            severity === 'error' ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {compatibilityResult.isCompatible 
              ? 'Browser Compatibility Warning' 
              : 'Browser Not Fully Supported'}
          </h3>
          <div className={`mt-2 text-sm ${
            severity === 'error' ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {!compatibilityResult.isCompatible && (
              <p className="mb-2">
                Your browser ({compatibilityResult.browserInfo.name} {compatibilityResult.browserInfo.version}) 
                is missing some required features for audio recording.
              </p>
            )}
            
            {compatibilityResult.unsupportedFeatures.length > 0 && (
              <div className="mb-2">
                <p className="font-medium">Missing features:</p>
                <ul className="list-disc list-inside ml-2">
                  {compatibilityResult.unsupportedFeatures.map(feature => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {compatibilityResult.warnings.length > 0 && (
              <div className="mb-2">
                <p className="font-medium">Warnings:</p>
                <ul className="list-disc list-inside ml-2">
                  {compatibilityResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {!compatibilityResult.isCompatible && (
              <div className="mt-3">
                <p className="font-medium mb-1">Recommended browsers:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Chrome 90 or later</li>
                  <li>Firefox 88 or later</li>
                  <li>Edge 90 or later</li>
                  <li>Safari 14 or later</li>
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={onViewDetails}
              className={`text-sm font-medium underline ${
                severity === 'error' ? 'text-red-800 hover:text-red-900' : 'text-yellow-800 hover:text-yellow-900'
              }`}
            >
              View Details
            </button>
            {compatibilityResult.canProceedWithLimitations && (
              <button
                onClick={onDismiss}
                className={`text-sm font-medium underline ${
                  severity === 'error' ? 'text-red-800 hover:text-red-900' : 'text-yellow-800 hover:text-yellow-900'
                }`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
