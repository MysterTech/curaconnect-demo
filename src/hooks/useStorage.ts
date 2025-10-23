import { useState, useEffect, useCallback } from 'react';
import { Session, SessionFilter } from '../models/types';
import { StorageService } from '../services/StorageService';

export const useStorage = () => {
  const [storageService] = useState(() => new StorageService());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allSessions = await storageService.getAllSessions();
      setSessions(allSessions);
      return allSessions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storageService]);

  const loadSessionsByFilter = useCallback(async (filter: SessionFilter) => {
    try {
      setLoading(true);
      setError(null);
      const filteredSessions = await storageService.getSessionsByFilter(filter);
      setSessions(filteredSessions);
      return filteredSessions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filtered sessions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storageService]);

  const getSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      return await storageService.getSession(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get session');
      throw err;
    }
  }, [storageService]);

  const saveSession = useCallback(async (session: Session) => {
    try {
      setError(null);
      await storageService.saveSession(session);
      // Update local sessions list
      setSessions(prev => {
        const index = prev.findIndex(s => s.id === session.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = session;
          return updated;
        } else {
          return [...prev, session];
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
      throw err;
    }
  }, [storageService]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>) => {
    try {
      setError(null);
      await storageService.updateSession(sessionId, updates);
      // Update local sessions list
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, ...updates } : s
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
      throw err;
    }
  }, [storageService]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      await storageService.deleteSession(sessionId);
      // Update local sessions list
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  }, [storageService]);

  const exportSession = useCallback(async (sessionId: string, format: 'json' | 'text' | 'pdf') => {
    try {
      setError(null);
      return await storageService.exportSession(sessionId, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export session');
      throw err;
    }
  }, [storageService]);

  const exportMultipleSessions = useCallback(async (sessionIds: string[], format: 'json' | 'text' | 'pdf') => {
    try {
      setError(null);
      return await storageService.exportMultipleSessions(sessionIds, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export sessions');
      throw err;
    }
  }, [storageService]);

  const searchSessions = useCallback(async (query: string) => {
    try {
      setError(null);
      return await storageService.searchSessions(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search sessions');
      throw err;
    }
  }, [storageService]);

  const getSessionCount = useCallback(async () => {
    try {
      setError(null);
      return await storageService.getSessionCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get session count');
      throw err;
    }
  }, [storageService]);

  const clearAllSessions = useCallback(async () => {
    try {
      setError(null);
      await storageService.clearAllSessions();
      setSessions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear sessions');
      throw err;
    }
  }, [storageService]);

  // Load sessions on mount
  useEffect(() => {
    loadAllSessions();
  }, [loadAllSessions]);

  return {
    sessions,
    loading,
    error,
    loadAllSessions,
    loadSessionsByFilter,
    getSession,
    saveSession,
    updateSession,
    deleteSession,
    exportSession,
    exportMultipleSessions,
    searchSessions,
    getSessionCount,
    clearAllSessions,
    clearError: () => setError(null)
  };
};