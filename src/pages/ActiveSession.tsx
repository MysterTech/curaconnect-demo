import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session, RecordingState, TranscriptSegment } from '../models/types';
import { RecordingControls, useRecordingKeyboardShortcuts } from '../components/recording/RecordingControls';
import { AudioVisualizer } from '../components/recording/AudioVisualizer';
import { TranscriptPanel } from '../components/transcript/TranscriptPanel';
import { DocumentationPanel } from '../components/documentation/DocumentationPanel';
import { SessionManager } from '../services/SessionManager';
import { RecordingController } from '../services/RecordingController';
import { TranscriptionServiceManager } from '../services/TranscriptionServiceManager';
import { DocumentationGenerator } from '../services/DocumentationGenerator';
import { StorageService } from '../services/StorageService';

export const ActiveSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);

  // Services (in a real app, these would be injected via context or hooks)
  const [sessionManager] = useState(() => new SessionManager(
    new StorageService(),
    new RecordingController(),
    new TranscriptionServiceManager(),
    new DocumentationGenerator()
  ));

  // Load session on mount
  useEffect(() => {
    let isMounted = true;
    
    const initSession = async () => {
      if (!isMounted) return;
      
      if (sessionId) {
        await loadSession(sessionId);
      } else {
        // Create new session
        await createNewSession();
      }
    };
    
    initSession();
    
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Handler functions (defined before usage)
  const loadSession = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const loadedSession = await sessionManager.getSession(id);
      setSession(loadedSession);
      
      // If session is active, get current recording state
      if (loadedSession.status === 'active') {
        const currentState = sessionManager.getRecordingState();
        setRecordingState(currentState);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const newSession = await sessionManager.createSession();
      setSession(newSession);
      navigate(`/session/${newSession.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    if (!session) return;
    
    try {
      await sessionManager.startSession(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handlePauseRecording = async () => {
    if (!session) return;
    
    try {
      await sessionManager.pauseSession(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause recording');
    }
  };

  const handleResumeRecording = async () => {
    if (!session) return;
    
    try {
      await sessionManager.resumeSession(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume recording');
    }
  };

  const handleStopRecording = async () => {
    if (recordingState.duration > 30) {
      setShowStopConfirmation(true);
    } else {
      await confirmStopRecording();
    }
  };

  // Set up event listeners
  useEffect(() => {
    const handleSessionUpdate = (updatedSession: Session) => {
      setSession(updatedSession);
    };

    const handleRecordingStateChange = (state: RecordingState) => {
      setRecordingState(state);
    };

    const handleError = (error: Error) => {
      setError(error.message);
    };

    sessionManager.onSessionUpdate(handleSessionUpdate);
    sessionManager.onError(handleError);

    // Use the recording state change handler in a different way
    handleRecordingStateChange(recordingState);

    return () => {
      // Cleanup listeners
    };
  }, [sessionManager]);

  // Keyboard shortcuts
  useRecordingKeyboardShortcuts(
    recordingState,
    handleStartRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleStopRecording,
    true
  );

  const confirmStopRecording = async () => {
    if (!session) return;
    
    try {
      await sessionManager.stopSession(session.id);
      setShowStopConfirmation(false);
      navigate(`/session/${session.id}/review`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  const handleDocumentationUpdate = async (updates: Partial<Session['documentation']>) => {
    if (!session) return;
    
    try {
      await sessionManager.updateDocumentation(session.id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update documentation');
    }
  };

  const handleTranscriptSegmentClick = (segment: TranscriptSegment) => {
    // Could implement features like editing segment or jumping to audio position
    console.log('Transcript segment clicked:', segment);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Session Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h2>
        <p className="text-gray-600 mb-6">The requested session could not be found.</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Session header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session.patientContext?.visitType || 'Patient Session'}
            </h1>
            <p className="text-gray-600 mt-1">
              Session ID: {session.id}
              {session.patientContext?.identifier && (
                <span className="ml-4">Patient: {session.patientContext.identifier}</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              session.status === 'active' ? 'bg-green-100 text-green-800' :
              session.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
            
            <button
              onClick={() => navigate('/sessions')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Recording controls and audio visualization */}
        <div className="space-y-6">
          <RecordingControls
            recordingState={recordingState}
            onStart={handleStartRecording}
            onPause={handlePauseRecording}
            onResume={handleResumeRecording}
            onStop={handleStopRecording}
          />
          
          <AudioVisualizer
            isActive={recordingState.isRecording && !recordingState.isPaused}
            type="bars"
            height={120}
            className="bg-white rounded-lg border border-gray-200 p-4"
          />
        </div>

        {/* Middle column - Transcript */}
        <div className="lg:col-span-1">
          <TranscriptPanel
            segments={session.transcript}
            isLive={recordingState.isRecording && !recordingState.isPaused}
            onSegmentClick={handleTranscriptSegmentClick}
            className="h-full"
          />
        </div>

        {/* Right column - Documentation */}
        <div className="lg:col-span-1">
          <DocumentationPanel
            documentation={session.documentation}
            isLive={recordingState.isRecording && !recordingState.isPaused}
            onUpdate={handleDocumentationUpdate}
            className="h-full"
          />
        </div>
      </div>

      {/* Stop confirmation modal */}
      {showStopConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Stop Recording?
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to stop this recording session? This will end the session and take you to the review page.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={confirmStopRecording}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Stop Session
                  </button>
                  <button
                    onClick={() => setShowStopConfirmation(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Continue Recording
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};