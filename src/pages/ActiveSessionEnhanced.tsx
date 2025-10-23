import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Session, RecordingState, TranscriptSegment } from "../models/types";
import {
  RecordingControls,
  useRecordingKeyboardShortcuts,
} from "../components/recording/RecordingControls";
import { AudioVisualizer } from "../components/recording/AudioVisualizer";
import { TranscriptPanel } from "../components/transcript/TranscriptPanel";
import { DocumentationPanel } from "../components/documentation/DocumentationPanel";
import { SessionManager } from "../services/SessionManager";
import { EnhancedRecordingController } from "../services/EnhancedRecordingController";
import { TranscriptionServiceManager } from "../services/TranscriptionServiceManager";
import { DocumentationGenerator } from "../services/DocumentationGenerator";
import { StorageService } from "../services/StorageService";
import { BrowserCompatibilityChecker } from "../utils/BrowserCompatibilityChecker";
import { PermissionManager } from "../utils/PermissionManager";
import { BrowserCompatibilityWarning } from "../components/recording/BrowserCompatibilityWarning";
import { PermissionPrompt } from "../components/recording/PermissionPrompt";
import { RecordingDiagnostics } from "../components/recording/RecordingDiagnostics";
import { PatientDetailsInput, Patient } from "../components/patient/PatientDetailsInput";
import type {
  CompatibilityResult,
  PermissionState,
  DiagnosticReport,
  RecordingError,
} from "../utils/types";

export const ActiveSessionEnhanced: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // State
  const [session, setSession] = useState<Session | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RecordingError | null>(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [visitCategory, setVisitCategory] = useState<string>('');

  // DEBUG: Log when session state changes
  useEffect(() => {
    if (session) {
      console.log('🔄 ActiveSessionEnhanced session state changed:', {
        id: session.id,
        transcriptLength: session.transcript.length,
        lastSegment: session.transcript[session.transcript.length - 1]
      });
    }
  }, [session]);

  // New state for enhanced features
  const [compatibilityResult, setCompatibilityResult] =
    useState<CompatibilityResult | null>(null);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("unknown");
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showCompatibilityWarning, setShowCompatibilityWarning] =
    useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticReport, setDiagnosticReport] =
    useState<DiagnosticReport | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Services
  const [sessionManager] = useState(() => {
    console.log('🏗️ Creating SessionManager instance');
    const manager = new SessionManager(
      new StorageService(),
      new EnhancedRecordingController(),
      new TranscriptionServiceManager(),
      new DocumentationGenerator()
    );
    console.log('✅ SessionManager instance created:', manager);
    return manager;
  });

  const [compatibilityChecker] = useState(
    () => new BrowserCompatibilityChecker()
  );
  const [permissionManager] = useState(() => new PermissionManager());

  // Initialize on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Load session
  useEffect(() => {
    if (isInitialized) {
      // Reset session state when sessionId changes
      setSession(null);
      setError(null);
      
      if (sessionId) {
        loadSession(sessionId);
      } else {
        createNewSession();
      }
    }
  }, [sessionId, isInitialized]);

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Step 1: Check browser compatibility
      const compatibility = compatibilityChecker.checkCompatibility();
      setCompatibilityResult(compatibility);

      if (!compatibility.isCompatible) {
        setShowCompatibilityWarning(true);
        if (!compatibility.canProceedWithLimitations) {
          setError({
            code: "BROWSER_UNSUPPORTED",
            message: "Browser not supported",
            userMessage: "Your browser does not support audio recording",
            resolution:
              "Please use a modern browser like Chrome, Firefox, or Edge",
            canRetry: false,
            canRecover: false,
          });
          setLoading(false);
          return;
        }
      }

      // Step 2: Check microphone permission
      const permission = await permissionManager.checkPermission();
      setPermissionState(permission);

      // Step 3: Validate recording capability (optional)
      // Skip if method doesn't exist on SessionManager
      try {
        if ("validateRecordingCapability" in sessionManager) {
          const validation = await (
            sessionManager as any
          ).validateRecordingCapability();

          if (!validation.canRecord) {
            const criticalIssues = validation.issues.filter(
              (issue: any) => issue.severity === "error"
            );
            if (criticalIssues.length > 0) {
              setError({
                code: "INITIALIZATION_FAILED",
                message: criticalIssues[0].message,
                userMessage: criticalIssues[0].message,
                resolution:
                  criticalIssues[0].resolution ||
                  "Please check your browser settings",
                canRetry: true,
                canRecover: true,
              });
            }
          }
        }
      } catch (validationError) {
        console.warn("Validation check skipped:", validationError);
      }

      setIsInitialized(true);
    } catch (err) {
      setError({
        code: "INITIALIZATION_ERROR",
        message: err instanceof Error ? err.message : "Unknown error",
        userMessage: "Failed to initialize recording",
        resolution: "Please refresh the page and try again",
        canRetry: true,
        canRecover: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const loadedSession = await sessionManager.getSession(id);
      setSession(loadedSession);

      if (loadedSession.status === "active") {
        const currentState = sessionManager.getRecordingState();
        setRecordingState(currentState);
      }
    } catch (err) {
      setError({
        code: "SESSION_LOAD_ERROR",
        message: err instanceof Error ? err.message : "Failed to load session",
        userMessage: "Failed to load session",
        resolution: "Please try again or create a new session",
        canRetry: true,
        canRecover: false,
      });
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
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('sessionCreated', { detail: newSession }));
      
      navigate(`/session/${newSession.id}`, { replace: true });
    } catch (err) {
      setError({
        code: "SESSION_CREATE_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to create session",
        userMessage: "Failed to create session",
        resolution: "Please try again",
        canRetry: true,
        canRecover: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    console.log('🎬 handleStartRecording called');
    console.log('📋 Session:', session?.id);
    console.log('🎤 Permission state:', permissionState);
    
    if (!session) {
      console.log('❌ No session available');
      return;
    }

    try {
      // Check permission first
      if (permissionState !== "granted") {
        console.log('⚠️ Permission not granted, showing prompt');
        setShowPermissionPrompt(true);
        return;
      }

      setError(null);
      console.log('🚀 Calling sessionManager.startSession()...');
      await sessionManager.startSession(session.id);
      console.log('✅ sessionManager.startSession() completed');
    } catch (err) {
      const recordingError: RecordingError = {
        code: "START_RECORDING_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to start recording",
        userMessage: "Failed to start recording",
        resolution: "Please check your microphone and try again",
        canRetry: true,
        canRecover: true,
      };
      setError(recordingError);
      // Handle recording error if method exists
      if ("handleRecordingError" in sessionManager) {
        await (sessionManager as any).handleRecordingError(
          err as Error,
          session.id
        );
      }
    }
  };

  const handlePauseRecording = async () => {
    if (!session) return;

    try {
      setError(null);
      await sessionManager.pauseSession(session.id);
    } catch (err) {
      setError({
        code: "PAUSE_RECORDING_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to pause recording",
        userMessage: "Failed to pause recording",
        resolution: "Please try again",
        canRetry: true,
        canRecover: true,
      });
    }
  };

  const handleResumeRecording = async () => {
    if (!session) return;

    try {
      setError(null);
      await sessionManager.resumeSession(session.id);
    } catch (err) {
      setError({
        code: "RESUME_RECORDING_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to resume recording",
        userMessage: "Failed to resume recording",
        resolution: "Please try again",
        canRetry: true,
        canRecover: true,
      });
    }
  };

  const handleStopRecording = async () => {
    if (recordingState.duration > 30) {
      setShowStopConfirmation(true);
    } else {
      await confirmStopRecording();
    }
  };

  const confirmStopRecording = async () => {
    if (!session) return;

    try {
      setError(null);
      await sessionManager.stopSession(session.id);
      
      // Auto-detect visit category from transcript
      if (session.transcript.length > 0) {
        const category = detectVisitCategory(session.transcript);
        setVisitCategory(category);
      }
      
      setShowStopConfirmation(false);
      navigate(`/session/${session.id}/review`);
    } catch (err) {
      setError({
        code: "STOP_RECORDING_ERROR",
        message:
          err instanceof Error ? err.message : "Failed to stop recording",
        userMessage: "Failed to stop recording",
        resolution: "Please try again",
        canRetry: true,
        canRecover: true,
      });
    }
  };

  // Helper function to detect visit category from transcript
  const detectVisitCategory = (transcript: TranscriptSegment[]): string => {
    const fullText = transcript.map(s => s.text).join(' ').toLowerCase();
    
    // Common medical visit categories and their keywords
    const categories = [
      { name: 'Routine Checkup', keywords: ['checkup', 'routine', 'annual', 'physical', 'wellness'] },
      { name: 'Follow-up Visit', keywords: ['follow up', 'follow-up', 'checking in', 'progress', 'how are you doing'] },
      { name: 'Acute Illness', keywords: ['sick', 'fever', 'cough', 'cold', 'flu', 'pain', 'hurt', 'ache'] },
      { name: 'Chronic Disease Management', keywords: ['diabetes', 'hypertension', 'blood pressure', 'cholesterol', 'chronic'] },
      { name: 'Dental Consultation', keywords: ['tooth', 'teeth', 'dental', 'cavity', 'gum', 'toothache'] },
      { name: 'Cardiology Consultation', keywords: ['heart', 'chest pain', 'palpitation', 'cardiac', 'blood pressure'] },
      { name: 'Pediatric Visit', keywords: ['child', 'baby', 'infant', 'vaccination', 'immunization', 'growth'] },
      { name: 'Gynecology Visit', keywords: ['pregnancy', 'prenatal', 'menstrual', 'gynecology', 'obstetric'] },
      { name: 'Mental Health', keywords: ['anxiety', 'depression', 'stress', 'mental health', 'counseling'] },
      { name: 'Injury/Trauma', keywords: ['injury', 'accident', 'fall', 'trauma', 'wound', 'cut', 'fracture'] }
    ];
    
    // Find the category with the most keyword matches
    let bestMatch = { name: 'General Consultation', score: 0 };
    
    for (const category of categories) {
      let score = 0;
      for (const keyword of category.keywords) {
        if (fullText.includes(keyword)) {
          score++;
        }
      }
      if (score > bestMatch.score) {
        bestMatch = { name: category.name, score };
      }
    }
    
    return bestMatch.name;
  };

  const handleRequestPermission = async () => {
    try {
      const result = await permissionManager.requestPermission();
      setPermissionState(result.state);

      if (result.granted) {
        setShowPermissionPrompt(false);
        // Try to start recording again
        if (session) {
          await handleStartRecording();
        }
      } else {
        setError({
          code: "PERMISSION_DENIED",
          message: "Microphone permission denied",
          userMessage: "Microphone access was denied",
          resolution: result.requiresManualGrant
            ? "Please grant microphone permission in your browser settings"
            : "Please allow microphone access when prompted",
          canRetry: !result.requiresManualGrant,
          canRecover: true,
        });
      }
    } catch (err) {
      setError({
        code: "PERMISSION_ERROR",
        message:
          err instanceof Error ? err.message : "Permission request failed",
        userMessage: "Failed to request microphone permission",
        resolution: "Please check your browser settings",
        canRetry: true,
        canRecover: true,
      });
    }
  };

  const handleRetryError = async () => {
    if (!error || !error.canRetry) return;

    setError(null);

    // Retry based on error code
    switch (error.code) {
      case "START_RECORDING_ERROR":
        await handleStartRecording();
        break;
      case "PERMISSION_DENIED":
        setShowPermissionPrompt(true);
        break;
      case "INITIALIZATION_FAILED":
        await initializeApp();
        break;
      default:
        // Generic retry - reinitialize
        await initializeApp();
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      const controller = sessionManager[
        "recordingController"
      ] as EnhancedRecordingController;
      const report = await controller.runDiagnostics();
      setDiagnosticReport(report);
      setShowDiagnostics(true);
    } catch (err) {
      console.error("Failed to run diagnostics:", err);
    }
  };

  const handleDocumentationUpdate = async (
    updates: Partial<Session["documentation"]>
  ) => {
    if (!session) return;

    try {
      await sessionManager.updateDocumentation(session.id, updates);
    } catch (err) {
      console.error("Failed to update documentation:", err);
    }
  };

  const handleTranscriptSegmentClick = (segment: TranscriptSegment) => {
    console.log("Transcript segment clicked:", segment);
  };

  // Set up event listeners
  useEffect(() => {
    console.log('🔗 Setting up event listeners for ActiveSessionEnhanced');
    
    const handleSessionUpdate = (updatedSession: Session) => {
      console.log('🔄 Session update received in UI:', {
        id: updatedSession.id,
        transcriptLength: updatedSession.transcript.length,
        status: updatedSession.status,
        lastSegment: updatedSession.transcript[updatedSession.transcript.length - 1]
      });
      
      // Force new object reference so React detects the change
      setSession({ ...updatedSession, transcript: [...updatedSession.transcript] });
      console.log('✅ UI state updated with new session (forced new reference)');
    };

    const handleRecordingStateChange = (state: RecordingState) => {
      console.log('🎙️ Recording state changed:', state);
      setRecordingState(state);
    };

    const handleError = (error: Error) => {
      console.error('❌ Error received in UI:', error);
      setError({
        code: "SESSION_ERROR",
        message: error.message,
        userMessage: "An error occurred",
        resolution: "Please try again",
        canRetry: true,
        canRecover: true,
      });
    };

    sessionManager.onSessionUpdate(handleSessionUpdate);
    sessionManager.onError(handleError);
    
    console.log('✅ Event listeners registered');

    return () => {
      console.log('🔌 Cleaning up event listeners');
    };
  }, [sessionManager]);

  // Keyboard shortcuts
  useRecordingKeyboardShortcuts(
    recordingState,
    handleStartRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleStopRecording,
    isInitialized && !error
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing recording system...</p>
        </div>
      </div>
    );
  }

  // Critical error state
  if (error && !error.canRecover && !session) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-2xl mx-auto mt-8">
        <div className="flex">
          <svg
            className="w-6 h-6 text-red-400 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Unable to Initialize Recording
            </h3>
            <p className="text-sm text-red-700 mb-3">{error.userMessage}</p>
            {error.resolution && (
              <p className="text-sm text-red-600 mb-4">{error.resolution}</p>
            )}
            <div className="flex space-x-3">
              {error.canRetry && (
                <button
                  onClick={handleRetryError}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
              >
                Return to Dashboard
              </button>
              <button
                onClick={handleRunDiagnostics}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Run Diagnostics
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Session Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The requested session could not be found.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Browser compatibility warning */}
      {showCompatibilityWarning && compatibilityResult && (
        <BrowserCompatibilityWarning
          compatibilityResult={compatibilityResult}
          onDismiss={() => setShowCompatibilityWarning(false)}
          onViewDetails={handleRunDiagnostics}
        />
      )}

      {/* Patient Details */}
      <PatientDetailsInput
        selectedPatient={selectedPatient}
        onPatientSelect={setSelectedPatient}
        visitCategory={visitCategory}
        isRecording={recordingState.isRecording}
        disabled={loading}
      />

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {error.userMessage}
              </h3>
              {error.resolution && (
                <p className="text-sm text-red-700 mt-1">{error.resolution}</p>
              )}
              <div className="mt-3 flex space-x-3">
                {error.canRetry && (
                  <button
                    onClick={handleRetryError}
                    className="text-sm text-red-800 underline hover:text-red-900"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => setError(null)}
                  className="text-sm text-red-800 underline hover:text-red-900"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleRunDiagnostics}
                  className="text-sm text-red-800 underline hover:text-red-900"
                >
                  Run Diagnostics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            disabled={!isInitialized || (error !== null && !error.canRecover)}
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

      {/* Permission prompt modal */}
      {showPermissionPrompt && (
        <PermissionPrompt
          isOpen={showPermissionPrompt}
          permissionState={permissionState}
          onRequestPermission={handleRequestPermission}
          onClose={() => setShowPermissionPrompt(false)}
          instructions={permissionManager.getPermissionInstructions(
            compatibilityChecker.getBrowserInfo().name
          )}
        />
      )}

      {/* Diagnostics modal */}
      {showDiagnostics && (
        <RecordingDiagnostics
          isOpen={showDiagnostics}
          diagnosticReport={diagnosticReport}
          onClose={() => setShowDiagnostics(false)}
          onRunTest={handleRunDiagnostics}
          onCopyReport={() => {
            if (diagnosticReport) {
              navigator.clipboard.writeText(
                JSON.stringify(diagnosticReport, null, 2)
              );
            }
          }}
        />
      )}

      {/* Stop confirmation modal */}
      {showStopConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Stop Recording?
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to stop this recording session? This
                  will end the session and take you to the review page.
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
