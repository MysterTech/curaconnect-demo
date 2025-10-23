import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Session, TranscriptSegment, RecordingState } from '../models/types';

export interface SessionState {
  activeSession: Session | null;
  recordingState: RecordingState;
  recentSessions: Session[];
  isLoading: boolean;
  error: string | null;
}

type SessionAction =
  | { type: 'SET_ACTIVE_SESSION'; payload: Session | null }
  | { type: 'UPDATE_SESSION'; payload: Session }
  | { type: 'UPDATE_RECORDING_STATE'; payload: RecordingState }
  | { type: 'ADD_TRANSCRIPT_SEGMENT'; payload: TranscriptSegment }
  | { type: 'UPDATE_DOCUMENTATION'; payload: Session['documentation'] }
  | { type: 'SET_RECENT_SESSIONS'; payload: Session[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: SessionState = {
  activeSession: null,
  recordingState: {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  },
  recentSessions: [],
  isLoading: false,
  error: null
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_ACTIVE_SESSION':
      return {
        ...state,
        activeSession: action.payload,
        error: null
      };

    case 'UPDATE_SESSION':
      const updatedSession = action.payload;
      return {
        ...state,
        activeSession: state.activeSession?.id === updatedSession.id ? updatedSession : state.activeSession,
        recentSessions: state.recentSessions.map(session =>
          session.id === updatedSession.id ? updatedSession : session
        )
      };

    case 'UPDATE_RECORDING_STATE':
      return {
        ...state,
        recordingState: action.payload
      };

    case 'ADD_TRANSCRIPT_SEGMENT':
      if (!state.activeSession) return state;
      
      const updatedActiveSession = {
        ...state.activeSession,
        transcript: [...state.activeSession.transcript, action.payload],
        updatedAt: new Date()
      };

      return {
        ...state,
        activeSession: updatedActiveSession
      };

    case 'UPDATE_DOCUMENTATION':
      if (!state.activeSession) return state;

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          documentation: action.payload,
          updatedAt: new Date()
        }
      };

    case 'SET_RECENT_SESSIONS':
      return {
        ...state,
        recentSessions: action.payload
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

interface SessionContextType {
  state: SessionState;
  setActiveSession: (session: Session | null) => void;
  updateSession: (session: Session) => void;
  updateRecordingState: (recordingState: RecordingState) => void;
  addTranscriptSegment: (segment: TranscriptSegment) => void;
  updateDocumentation: (documentation: Session['documentation']) => void;
  setRecentSessions: (sessions: Session[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const setActiveSession = React.useCallback((session: Session | null) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: session });
  }, []);

  const updateSession = React.useCallback((session: Session) => {
    dispatch({ type: 'UPDATE_SESSION', payload: session });
  }, []);

  const updateRecordingState = React.useCallback((recordingState: RecordingState) => {
    dispatch({ type: 'UPDATE_RECORDING_STATE', payload: recordingState });
  }, []);

  const addTranscriptSegment = React.useCallback((segment: TranscriptSegment) => {
    dispatch({ type: 'ADD_TRANSCRIPT_SEGMENT', payload: segment });
  }, []);

  const updateDocumentation = React.useCallback((documentation: Session['documentation']) => {
    dispatch({ type: 'UPDATE_DOCUMENTATION', payload: documentation });
  }, []);

  const setRecentSessions = React.useCallback((sessions: Session[]) => {
    dispatch({ type: 'SET_RECENT_SESSIONS', payload: sessions });
  }, []);

  const setLoading = React.useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = React.useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: SessionContextType = {
    state,
    setActiveSession,
    updateSession,
    updateRecordingState,
    addTranscriptSegment,
    updateDocumentation,
    setRecentSessions,
    setLoading,
    setError,
    clearError
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};