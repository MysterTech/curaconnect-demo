import { useEffect, useRef, useState } from 'react';

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  onWarning?: () => void;
}

export const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onWarning
}: UseSessionTimeoutOptions = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!isActive) return;

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      onWarning?.();
      
      // Start countdown interval
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, (timeoutMinutes * 60 * 1000) - elapsed);
        setTimeRemaining(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
        }
      }, 1000);
    }, (timeoutMinutes - warningMinutes) * 60 * 1000);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      setShowWarning(false);
      onTimeout?.();
    }, timeoutMinutes * 60 * 1000);
  };

  const startTimer = () => {
    setIsActive(true);
    resetTimer();
  };

  const stopTimer = () => {
    setIsActive(false);
    setShowWarning(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const extendSession = () => {
    if (showWarning) {
      resetTimer();
    }
  };

  // Track user activity
  useEffect(() => {
    if (!isActive) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (isActive && !showWarning) {
        resetTimer();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isActive, showWarning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return {
    isActive,
    showWarning,
    timeRemaining,
    startTimer,
    stopTimer,
    resetTimer,
    extendSession
  };
};
