import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session } from '../models/types';
import { AudioVisualizer } from '../components/recording/AudioVisualizer';
import { TranscriptPanel } from '../components/transcript/TranscriptPanel';
import { DocumentationPanel } from '../components/documentation/DocumentationPanel';
import { SimpleRecorder } from '../services/SimpleRecorder';
import { GeminiTranscriptionService } from '../services/GeminiTranscriptionService';
import { StorageService } from '../services/StorageService';
import { formatDuration } from '../utils/transformations';
import { SpeakerDiarizationService } from '../services/SpeakerDiarizationService';
import { DocumentationGenerator } from '../services/DocumentationGenerator';

export const ActiveSessionUpdated: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  // Services
  const [recorder] = useState(() => new SimpleRecorder());
  const [gemini] = useState(() => new GeminiTranscriptionService());
  const [storage] = useState(() => new StorageService());
  const [diarizer] = useState(() => new SpeakerDiarizationService());
  const [docGen] = useState(() => {
    const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
    const provider = geminiKey ? 'gemini' as const : 'openai' as const;
    const apiKey = geminiKey || openaiKey;
    const model = provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4';
    return new DocumentationGenerator({ provider, model, apiKey });
  });
  
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const chunkTimerRef = useRef<number | null>(null);
  const isProcessingChunkRef = useRef(false);
  // Refs to latest values to avoid stale closures in setInterval
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // durationRef not needed; timestamps are derived from the last transcript segment

  // Update recording state
  useEffect(() => {
    recorder.setOnStateChange((state) => {
      setIsRecording(state.isRecording);
      setDuration(state.duration);
    });
  }, [recorder]);

  // Load or create session
  useEffect(() => {
    let isMounted = true;
    
    const initSession = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        
        if (sessionId) {
          const loadedSession = await storage.getSession(sessionId);
          if (loadedSession) {
            setSession(loadedSession);
          } else {
            setError('Session not found');
          }
        } else {
          // Create new session
          const newSession = await createNewSession();
          if (newSession) {
            navigate(`/session/${newSession.id}`, { replace: true });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    
    initSession();
    
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Periodic chunk transcription while recording
  useEffect(() => {
    if (!sessionRef.current || !isRecording) {
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }
      return;
    }

    if (!gemini.isConfigured()) {
      return; // Can't transcribe without API key
    }
    if (chunkTimerRef.current) return; // Already running

    const intervalMs = 8000; // ~8 seconds between chunk uploads
    chunkTimerRef.current = window.setInterval(async () => {
      const current = sessionRef.current;
      if (!current || isProcessingChunkRef.current) return;
      const chunk = recorder.getChunk(true);
      if (!chunk || chunk.size === 0) return;

      try {
        isProcessingChunkRef.current = true;
        const result = await gemini.transcribe(chunk);
        if (result.segments && result.segments.length > 0) {
          // Stamp timestamps based on the last known transcript timestamp
          const lastTs = current.transcript.length > 0
            ? current.transcript[current.transcript.length - 1].timestamp
            : 0;
          const baseTs = lastTs + 1;
          const processed = result.segments.map((s, idx) => {
            const seg = { ...s, timestamp: baseTs + idx };
            const speaker = diarizer.identifySpeaker(seg, current.transcript);
            return { ...seg, speaker };
          });
          const updatedTranscript = [...current.transcript, ...processed];
          const updatedSession: Session = {
            ...current,
            transcript: updatedTranscript,
            updatedAt: new Date(),
          };
          // Update UI immediately so the doctor sees text as soon as transcription completes
          setSession(updatedSession);
          // Persist in background to avoid blocking the UI update
          void storage.updateSession(current.id, {
            transcript: updatedTranscript,
            updatedAt: updatedSession.updatedAt,
          }).catch((e) => console.warn('Background session save failed:', e));
        }
      } catch (e) {
        console.warn('Chunk transcription failed:', e);
      } finally {
        isProcessingChunkRef.current = false;
      }
    }, intervalMs);

    return () => {
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }
    };
  }, [isRecording, gemini, recorder, diarizer, storage]);

  const createNewSession = async (): Promise<Session | null> => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newSession: Session = {
        id: sessionId,
        createdAt: now,
        updatedAt: now,
        status: 'completed',
        transcript: [],
        documentation: {
          soapNote: {
            subjective: {},
            objective: {},
            assessment: { diagnoses: [] },
            plan: {}
          },
          clinicalEntities: [],
          lastUpdated: now,
          isFinalized: false
        },
        metadata: {
          duration: 0,
          processingStatus: 'pending'
        }
      };
      
      await storage.saveSession(newSession);
      setSession(newSession);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    }
  };

  const handleStartRecording = async () => {
    if (!session) return;
    
    try {
      setError(null);
      await recorder.start();
      
      // Update session status
      await storage.updateSession(session.id, {
        status: 'active',
        updatedAt: new Date()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (duration > 30) {
      setShowStopConfirmation(true);
    } else {
      await confirmStopRecording();
    }
  };

  const confirmStopRecording = async () => {
    if (!session) return;
    
    try {
      setError(null);
      setShowStopConfirmation(false);
      
      // Stop recording and get audio
      const audioBlob = await recorder.stop();
      
      // Update session with duration
      await storage.updateSession(session.id, {
        status: 'completed',
        updatedAt: new Date(),
        metadata: {
          ...session.metadata,
          duration
        }
      });
      
      // Transcribe with Gemini (final pass) and diarize
      if (gemini.isConfigured()) {
        setIsTranscribing(true);
        try {
          const result = await gemini.transcribe(audioBlob);
          if (result.segments && result.segments.length > 0) {
            const lastTs = session.transcript.length > 0
              ? session.transcript[session.transcript.length - 1].timestamp
              : 0;
            const baseTs = lastTs + 1;
            const processed = result.segments.map((s, idx) => {
              const seg = { ...s, timestamp: baseTs + idx };
              const speaker = diarizer.identifySpeaker(seg, session.transcript);
              return { ...seg, speaker };
            });

            // First, update the transcript immediately on UI
            const updatedSession: Session = {
              ...session,
              transcript: [...session.transcript, ...processed],
              updatedAt: new Date()
            };
            setSession(updatedSession);
            // Persist transcript in background
            void storage.saveSession(updatedSession).catch((e) =>
              console.warn('Background final session save failed:', e)
            );

            // Then, run documentation generation in the background without blocking UI
            void (async () => {
              try {
                const gen = await docGen.generateDocumentation(updatedSession.transcript);
                const withDoc: Session = {
                  ...updatedSession,
                  documentation: gen.documentation,
                  updatedAt: new Date(),
                };
                await storage.saveSession(withDoc);
                setSession(withDoc);
              } catch (docErr) {
                console.warn('Documentation generation failed:', docErr);
                setError(docErr instanceof Error ? docErr.message : 'Documentation generation failed');
              }
            })();
          } else {
            // Fallback: keep current transcript and still run background documentation
            setError(result.error || 'Transcription returned no segments');
            void (async () => {
              try {
                const gen = await docGen.generateDocumentation(session.transcript);
                const withDoc: Session = {
                  ...session,
                  documentation: gen.documentation,
                  updatedAt: new Date(),
                };
                await storage.saveSession(withDoc);
                setSession(withDoc);
              } catch (docErr) {
                console.warn('Documentation generation failed (fallback):', docErr);
                setError(docErr instanceof Error ? docErr.message : 'Documentation generation failed');
              }
            })();
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Transcription failed');
        } finally {
          setIsTranscribing(false);
        }
      } else {
        // Gemini not configured: still run documentation generation on the accumulated transcript
        void (async () => {
          try {
            const gen = await docGen.generateDocumentation(session.transcript);
            const withDoc: Session = {
              ...session,
              documentation: gen.documentation,
              updatedAt: new Date(),
            };
            await storage.saveSession(withDoc);
            setSession(withDoc);
          } catch (docErr) {
            console.warn('Documentation generation failed (no-Gemini fallback):', docErr);
            setError(docErr instanceof Error ? docErr.message : 'Documentation generation failed');
          }
        })();
      }
      
      // Keep user on this page so full transcript is visible immediately.
      // Documentation generation continues in background and updates the UI when ready.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsTranscribing(false);
    }
  };

  const handleDocumentationUpdate = async (updates: Partial<Session['documentation']>) => {
    if (!session) return;
    
    try {
      const updatedDoc = {
        ...session.documentation,
        ...updates,
        lastUpdated: new Date()
      };
      
      await storage.updateSession(session.id, {
        documentation: updatedDoc,
        updatedAt: new Date()
      });
      
      setSession({
        ...session,
        documentation: updatedDoc
      });
    } catch (err) {
      console.error('Failed to update documentation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-2xl mx-auto mt-8">
        <div className="flex">
          <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">Session Error</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
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
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-800 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcribing status */}
      {isTranscribing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-blue-800">Transcribing with Gemini AI...</span>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Recording controls */}
        <div className="space-y-6">
          {/* Simple Recording Controls */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            {/* Status */}
            <div className="text-center mb-6">
              {isRecording && (
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Recording...</span>
                </div>
              )}
              
              {/* Duration */}
              <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                {formatDuration(duration)}
              </div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="text-center mt-4">
              <div className="text-sm font-medium text-gray-700">
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </div>
            </div>
          </div>
          
          <AudioVisualizer
            isActive={isRecording}
            type="bars"
            height={120}
            className="bg-white rounded-lg border border-gray-200 p-4"
          />
        </div>

        {/* Middle column - Transcript */}
        <div className="lg:col-span-1">
          <TranscriptPanel
            segments={session.transcript}
            isLive={isRecording}
            labelMode="generic"
            className="h-full"
          />
        </div>

        {/* Right column - Documentation */}
        <div className="lg:col-span-1">
          <DocumentationPanel
            documentation={session.documentation}
            isLive={isRecording}
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
                  Are you sure you want to stop this recording session? The audio will be transcribed with Gemini AI.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={confirmStopRecording}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700"
                  >
                    Stop & Transcribe
                  </button>
                  <button
                    onClick={() => setShowStopConfirmation(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400"
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
