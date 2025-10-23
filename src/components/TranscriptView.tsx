import React from 'react';
import { TranscriptSegment } from '../models/types';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  isRecording: boolean;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ segments, isRecording }) => {
  const getSpeakerColor = (speaker: string) => {
    switch (speaker.toLowerCase()) {
      case 'provider':
      case 'doctor':
        return 'bg-blue-50 text-blue-700';
      case 'patient':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getSpeakerLabel = (speaker: string) => {
    switch (speaker.toLowerCase()) {
      case 'provider':
        return 'Doctor';
      case 'patient':
        return 'Patient';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Live Transcript</h3>
        {isRecording && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            <span className="text-xs text-red-600">Recording</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-sm">No transcript yet</p>
            <p className="text-xs mt-1">Start recording to see the transcript</p>
          </div>
        ) : (
          segments.map((segment, index) => (
            <div key={segment.id || index} className="flex space-x-3">
              <div className={`px-2 py-1 rounded text-xs font-medium h-fit ${getSpeakerColor(segment.speaker)}`}>
                {getSpeakerLabel(segment.speaker)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 leading-relaxed">{segment.text}</p>
                {segment.confidence && segment.confidence < 0.8 && (
                  <span className="text-xs text-yellow-600 mt-1 inline-block">
                    Low confidence
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
