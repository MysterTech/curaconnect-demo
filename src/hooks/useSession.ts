import { useState, useEffect, useCallback } from 'react';
import { Session, PatientContext } from '../models/types';
import { SessionManager } from '../services/SessionManager';
import { StorageService } from '../services/StorageService';
import { RecordingController } from '../services/RecordingController';
import { TranscriptionServiceManager } from '../services/TranscriptionServiceManager';
import { DocumentationGenerator } from '../services/DocumentationGenerator';

export const useSession = (sessionId?: string) => {
  const [sessionManager] = useState(() => new SessionManager(
    new StorageService(),
    new RecordingController(),
    new TranscriptionServiceManager(),
    new DocumentationGenerator()
  ));

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }

    // Set up event listeners
    const handleSessionUpdate = (updatedSession: Session) => {
      setSession(updatedSession);
    };

    const handleError = (err: Error) => {
      setError(err.message);
    };

    sessionManager.onSessionUpdate(handleSessionUpdate);
    sessionManager.onError(handleError);

    return () => {
      sessionManager.dispose();
    };
  }, [sessionId, sessionManager]);

  const loadSession = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const loadedSession = await sessionManager.getSession(id);
      setSession(loadedSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [sessionManager]);

  const createSession = useCallback(async (patientContext?: PatientContext) => {
    try {
      setLoading(true);
      setError(null);
      const newSession = await sessionManager.createSession(patientContext);
      setSession(newSession);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionManager]);

  const startSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await sessionManager.startSession(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      throw err;
    }
  }, [sessionManager]);

  const pauseSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await sessionManager.pauseSession(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause session');
      throw err;
    }
  }, [sessionManager]);

  const resumeSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await sessionManager.resumeSession(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume session');
      throw err;
    }
  }, [sessionManager]);

  const stopSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await sessionManager.stopSession(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop session');
      throw err;
    }
  }, [sessionManager]);

  const updateDocumentation = useCallback(async (id: string, documentation: Partial<Session['documentation']>) => {
    try {
      setError(null);
      await sessionManager.updateDocumentation(id, documentation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update documentation');
      throw err;
    }
  }, [sessionManager]);

  const finalizeSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await sessionManager.finalizeSession(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize session');
      throw err;
    }
  }, [sessionManager]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      setError(null);
      await sessionManager.deleteSession(id);
      if (session?.id === id) {
        setSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  }, [sessionManager, session]);

  return {
    session,
    loading,
    error,
    createSession,
    loadSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    updateDocumentation,
    finalizeSession,
    deleteSession,
    clearError: () => setError(null),
    getActiveSession: () => sessionManager.getActiveSession(),
    hasActiveSession: () => sessionManager.hasActiveSession(),
    getRecordingState: () => sessionManager.getRecordingState()
  };
};