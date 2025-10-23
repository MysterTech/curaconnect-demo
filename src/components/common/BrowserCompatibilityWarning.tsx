import React, { useState } from 'react';
import type { BrowserFeature, CompatibilityResult } from '../../utils/types';

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
  const [showDetails, setShowDetails] = useState(false);

  const { isCompatible, browserInfo, unsupportedFeatures, warnings, canProceedWithLimitations } = compatibilityResult;

  // Don't show warning if fully compatible
  if (isCompatible && warnings.length === 0) {
    return null;
  }

  const severity = !isCompatible ? 'error' : canProceedWithLimitations ? 'warning' : 'info';

  const getIcon = () => {
    if (severity === 'error') {
      return (
        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  const getBgColor = () => {
    if (severity === 'error') return 'bg-red-50 border-red-200';
    if (severity === 'warning') return 'bg-yellow-50 border-yellow-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getTextColor = () => {
    if (severity === 'error') return 'text-red-800';
    if (severity === 'warning') return 'text-yellow-800';
    return 'text-blue-800';
  };

  return (
    <div className={`rounded-lg border ${getBgColor()} p-4 mb-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {!isCompatible ? 'Browser Not Supported' : 'Browser Compatibility Warning'}
          </h3>
          <div className={`mt-2 text-sm ${getTextColor()}`}>
            <p>
              {!isCompatible
                ? `Your browser (${browserInfo.name} ${browserInfo.version}) does not support all required features for audio recording.`
                : `Your browser (${browserInfo.name} ${browserInfo.version}) has limited support for some recording features.`}
            </p>

            {unsupportedFeatures.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Missing features:</p>
                <ul className="list-disc list-inside mt-1">
                  {unsupportedFeatures.map((feature: BrowserFeature, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Warnings:</p>
                <ul className="list-disc list-inside mt-1">
                  {warnings.map((warning: string, index: number) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isCompatible && (
              <div className="mt-3">
                <p className="font-medium">Recommended browsers:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Google Chrome 90+</li>
                  <li>Mozilla Firefox 88+</li>
                  <li>Microsoft Edge 90+</li>
                  <li>Safari 14+</li>
                </ul>
              </div>
            )}

            {canProceedWithLimitations && (
              <p className="mt-2 font-medium">
                You can proceed with limited functionality, but some features may not work as expected.
              </p>
            )}
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`text-sm font-medium ${getTextColor()} hover:underline`}
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
            {(canProceedWithLimitations || isCompatible) && (
              <button
                onClick={onDismiss}
                className={`text-sm font-medium ${getTextColor()} hover:underline`}
              >
                Dismiss
              </button>
            )}
          </div>

          {showDetails && (
            <div className={`mt-4 p-3 bg-white rounded border ${severity === 'error' ? 'border-red-200' : 'border-yellow-200'}`}>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Details</h4>
              <dl className="text-xs text-gray-700 space-y-1">
                <div>
                  <dt className="font-medium inline">Browser:</dt>
                  <dd className="inline ml-2">{browserInfo.name} {browserInfo.version}</dd>
                </div>
                <div>
                  <dt className="font-medium inline">Platform:</dt>
                  <dd className="inline ml-2">{browserInfo.platform}</dd>
                </div>
                <div>
                  <dt className="font-medium inline">User Agent:</dt>
                  <dd className="inline ml-2 break-all">{browserInfo.userAgent}</dd>
                </div>
              </dl>
              <button
                onClick={onViewDetails}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View Full Compatibility Report →
              </button>
            </div>
          )}
        </div>
        {(canProceedWithLimitations || isCompatible) && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={`inline-flex rounded-md p-1.5 ${getTextColor()} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
