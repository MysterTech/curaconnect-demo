import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleRecorder } from '../services/SimpleRecorder';
import { GeminiTranscriptionService } from '../services/GeminiTranscriptionService';
import { formatDuration } from '../utils/transformations';

export const SimpleRecordingPage: React.FC = () => {
  const navigate = useNavigate();
  const [recorder] = useState(() => new SimpleRecorder());
  const [gemini] = useState(() => new GeminiTranscriptionService());
  
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Update state when recorder changes
  useEffect(() => {
    recorder.setOnStateChange((state) => {
      setIsRecording(state.isRecording);
      setDuration(state.duration);
    });
  }, [recorder]);

  const handleStartRecording = async () => {
    try {
      setError(null);
      setTranscription('');
      setAudioBlob(null);
      await recorder.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      setError(null);
      const blob = await recorder.stop();
      setAudioBlob(blob);
      
      // Automatically start transcription
      if (gemini.isConfigured()) {
        setIsTranscribing(true);
        try {
          const result = await gemini.transcribe(blob);
          if (result.segments && result.segments.length > 0) {
            const text = result.segments.map(s => s.text).join(' ');
            setTranscription(text);
          } else {
            setError(result.error || 'Transcription returned no segments');
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Transcription failed');
        } finally {
          setIsTranscribing(false);
        }
      } else {
        setError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsTranscribing(false);
    }
  };

  const handleDownloadRecording = () => {
    if (!audioBlob) return;
    
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Simple Audio Recorder</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6">
          {/* Status */}
          <div className="text-center mb-6">
            {isRecording && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Recording...</span>
              </div>
            )}
            
            {/* Duration */}
            <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
              {formatDuration(duration)}
            </div>
            <div className="text-sm text-gray-500">Duration</div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="Start Recording"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                title="Stop Recording"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              </button>
            )}
          </div>

          {/* Button Label */}
          <div className="text-center mt-4">
            <div className="text-sm font-medium text-gray-700">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Transcription Status */}
        {isTranscribing && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-blue-800">Transcribing with Gemini AI...</span>
            </div>
          </div>
        )}

        {/* Recording Actions */}
        {audioBlob && !isRecording && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recording Saved</h3>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadRecording}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Recording
              </button>
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setTranscription('');
                  setDuration(0);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                New Recording
              </button>
            </div>
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transcription</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{transcription}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(transcription);
                alert('Transcription copied to clipboard!');
              }}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Transcription
            </button>
          </div>
        )}

        {/* Instructions */}
        {!gemini.isConfigured() && !isRecording && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Gemini API Key Required</h4>
            <p className="text-sm text-yellow-700">
              To use transcription, add your Gemini API key to the <code className="bg-yellow-100 px-1 rounded">.env</code> file:
            </p>
            <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded">
              VITE_GEMINI_API_KEY=your-api-key-here
            </pre>
            <p className="text-sm text-yellow-700 mt-2">
              Get your API key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
