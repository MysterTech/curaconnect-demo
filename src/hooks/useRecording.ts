import { useState, useEffect, useCallback } from 'react';
import { RecordingState } from '../models/types';
import { RecordingController } from '../services/RecordingController';

export const useRecording = (recordingController?: RecordingController) => {
  const [controller] = useState(() => recordingController || new RecordingController());
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeController = async () => {
      try {
        await controller.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize recording');
      }
    };

    initializeController();

    // Set up event listeners
    const handleStateChange = (newState: RecordingState) => {
      setState(newState);
    };

    const handleError = (err: Error) => {
      setError(err.message);
    };

    controller.onStateChange(handleStateChange);
    controller.onError(handleError);

    return () => {
      controller.dispose();
    };
  }, [controller]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await controller.startRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      throw err;
    }
  }, [controller]);

  const pauseRecording = useCallback(async () => {
    try {
      setError(null);
      await controller.pauseRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause recording');
      throw err;
    }
  }, [controller]);

  const resumeRecording = useCallback(async () => {
    try {
      setError(null);
      await controller.resumeRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume recording');
      throw err;
    }
  }, [controller]);

  const stopRecording = useCallback(async () => {
    try {
      setError(null);
      return await controller.stopRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      throw err;
    }
  }, [controller]);

  const checkPermission = useCallback(async () => {
    try {
      return await controller.checkMicrophonePermission();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check permission');
      return false;
    }
  }, [controller]);

  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      return await controller.requestPermission();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      return false;
    }
  }, [controller]);

  return {
    state,
    error,
    isInitialized,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    checkPermission,
    requestPermission,
    clearError: () => setError(null)
  };
};