import React, { useEffect, useRef, useState } from 'react';
import { TranscriptSegment } from '../../models/types';
import { formatTimestamp } from '../../utils/transformations';

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  isLive?: boolean;
  autoScroll?: boolean;
  showTimestamps?: boolean;
  showSpeakerLabels?: boolean;
  labelMode?: 'role' | 'generic';
  onSegmentClick?: (segment: TranscriptSegment) => void;
  className?: string;
}

interface TranscriptBubbleProps {
  segment: TranscriptSegment;
  showTimestamp: boolean;
  labelMode?: 'role' | 'generic';
  onClick?: (segment: TranscriptSegment) => void;
}

const TranscriptBubble: React.FC<TranscriptBubbleProps> = ({
  segment,
  showTimestamp,
  labelMode = 'role',
  onClick
}) => {
  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'provider':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'patient':
        return 'bg-gray-100 text-gray-900 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-900 border-yellow-200';
    }
  };
  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'provider':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case 'patient':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        );
    }
  };

  const getSpeakerLabel = (speaker: string) => {
    if (labelMode === 'generic') {
      switch (speaker) {
        case 'provider':
          return 'User 1';
        case 'patient':
          return 'User 2';
        default:
          return 'User 3';
      }
    }
    switch (speaker) {
      case 'provider':
        return 'Provider';
      case 'patient':
        return 'Patient';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors duration-200 bg-gray-50 border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-sm hover:bg-gray-100' : ''}`}
      onClick={() => onClick?.(segment)}
    >
      {/* Timestamp badge */}
      <div className="flex-shrink-0">
        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
          {formatTimestamp(segment.timestamp)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Text content */}
        <p className="text-sm leading-relaxed break-words text-gray-900">
          {segment.text}
        </p>
        
        {/* Confidence indicator (optional) */}
        {segment.confidence !== undefined && segment.confidence < 0.8 && (
          <span className="text-xs text-gray-400 mt-1 inline-block">
            Low confidence: {Math.round((segment.confidence || 0) * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
 
export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  segments,
  isLive = false,
  autoScroll = true,
  showTimestamps = true,
  showSpeakerLabels: _showSpeakerLabels = true,
  labelMode = 'role',
  onSegmentClick,
  className = ''
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // DEBUG: Log when segments prop changes
  useEffect(() => {
    console.log('🎯 TranscriptPanel received segments update:', {
      count: segments.length,
      segments: segments.map(s => ({ id: s.id, text: s.text.substring(0, 50), speaker: s.speaker }))
    });
  }, [segments]);

  // Auto-scroll to bottom when new segments are added
  useEffect(() => {
    if (autoScroll && !isUserScrolling && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [segments, autoScroll, isUserScrolling]);

  // Handle scroll events to detect user scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: number | undefined;

    const handleScroll = () => {
      setIsUserScrolling(true);
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && segments.length > 0);

      // Reset flag after a delay
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, [segments.length]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setShowScrollToBottom(false);
    }
  };

  const clearTranscript = () => {
    console.log('Clear transcript requested');
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Transcript</h3>
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {segments.length} segments
          </span>
          {segments.length > 0 && (
            <button
              onClick={clearTranscript}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {segments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">
                {isLive ? 'Waiting for speech...' : 'No transcript available'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={scrollContainerRef}
              className="h-full overflow-y-auto p-4 space-y-3"
            >
              {segments.map((segment) => (
                <TranscriptBubble
                  key={segment.id}
                  segment={segment}
                  showTimestamp={showTimestamps}
                  labelMode={labelMode}
                  onClick={onSegmentClick}
                />
              ))}
            </div>

            {showScrollToBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {segments.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showTimestamps}
                  onChange={(e) => {
                    console.log('Toggle timestamps:', e.target.checked);
                  }}
                  className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show timestamps
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => {
                    console.log('Toggle auto-scroll:', e.target.checked);
                  }}
                  className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Auto-scroll
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-indigo-600 hover:text-indigo-700">Export</button>
              <button className="text-indigo-600 hover:text-indigo-700">Search</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
;

// Compact transcript view for smaller spaces
export const CompactTranscriptPanel: React.FC<{
  segments: TranscriptSegment[];
  maxSegments?: number;
  className?: string;
}> = ({ segments, maxSegments = 5, className = '' }) => {
  const recentSegments = segments.slice(-maxSegments);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Transcript</h4>
      
      {recentSegments.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No transcript yet...</p>
      ) : (
        <div className="space-y-2">
          {recentSegments.map((segment) => (
            <div key={segment.id} className="text-sm flex items-start space-x-2">
              <span className="font-medium text-indigo-600 text-xs flex-shrink-0">
                {formatTimestamp(segment.timestamp)}
              </span>
              <span className="text-gray-900">{segment.text}</span>
            </div>
          ))}
          
          {segments.length > maxSegments && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              +{segments.length - maxSegments} more segments
            </div>
          )}
        </div>
      )}
    </div>
  );
};