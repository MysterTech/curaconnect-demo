/**
 * Utility class for handling and categorizing recording errors
 * Provides user-friendly messages and resolution steps
 */

import {
  RecordingError,
  RecordingPermissionError,
  RecordingInitializationError,
  BrowserCompatibilityError,
  RecordingDeviceError,
  NoAudioDeviceError,
  RecordingStateError,
  RecordingNetworkError,
  ErrorCategory,
  RecoveryAction
} from './recordingErrors';

export class RecordingErrorHandler {
  /**
   * Categorize an error based on its type and message
   */
  categorizeError(error: Error): ErrorCategory {
    if (error instanceof RecordingError) {
      return error.category;
    }

    const message = error.message.toLowerCase();

    // Permission errors
    if (
      message.includes('permission') ||
      message.includes('denied') ||
      message.includes('notallowederror')
    ) {
      return 'permission';
    }

    // Device errors
    if (
      message.includes('device') ||
      message.includes('microphone') ||
      message.includes('notfounderror') ||
      message.includes('notreadableerror')
    ) {
      return 'device';
    }

    // Browser compatibility errors
    if (
      message.includes('not supported') ||
      message.includes('notsupportederror') ||
      message.includes('mediarecorder')
    ) {
      return 'browser';
    }

    // Initialization errors
    if (
      message.includes('initialization') ||
      message.includes('initialize') ||
      message.includes('setup')
    ) {
      return 'initialization';
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout')
    ) {
      return 'network';
    }

    return 'unknown';
  }

  /**
   * Get a user-friendly message for an error
   */
  getUserMessage(error: Error): string {
    if (error instanceof RecordingError) {
      return error.userMessage;
    }

    const category = this.categorizeError(error);

    switch (category) {
      case 'permission':
        return 'Microphone access was denied';
      case 'device':
        return 'There was a problem with your microphone';
      case 'browser':
        return 'Your browser does not support audio recording';
      case 'initialization':
        return 'Failed to start recording';
      case 'network':
        return 'Network connection issue';
      default:
        return 'An unexpected error occurred';
    }
  }

  /**
   * Get resolution steps for an error
   */
  getResolutionSteps(error: Error): string[] {
    if (error instanceof RecordingError) {
      return [error.resolution];
    }

    const category = this.categorizeError(error);

    switch (category) {
      case 'permission':
        return [
          'Click the camera/microphone icon in your browser\'s address bar',
          'Select "Allow" for microphone access',
          'Refresh the page and try again'
        ];
      case 'device':
        return [
          'Check that your microphone is properly connected',
          'Ensure no other application is using the microphone',
          'Try selecting a different microphone from the device list',
          'Check your system audio settings'
        ];
      case 'browser':
        return [
          'Update your browser to the latest version',
          'Try using Chrome, Firefox, Safari, or Edge',
          'Ensure your browser supports WebRTC and MediaRecorder'
        ];
      case 'initialization':
        return [
          'Refresh the page and try again',
          'Clear your browser cache',
          'Check your browser console for detailed errors'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact your network administrator if the problem persists'
        ];
      default:
        return [
          'Refresh the page and try again',
          'Check your browser console for more details',
          'Contact support if the problem persists'
        ];
    }
  }

  /**
   * Determine if an error is recoverable
   */
  isRecoverable(error: Error): boolean {
    if (error instanceof RecordingError) {
      return error.canRecover;
    }

    const category = this.categorizeError(error);
    
    // Browser compatibility errors are not recoverable
    if (category === 'browser') {
      return false;
    }

    // Most other errors are potentially recoverable
    return true;
  }

  /**
   * Determine if an operation can be retried
   */
  canRetry(error: Error): boolean {
    if (error instanceof RecordingError) {
      return error.canRetry;
    }

    const category = this.categorizeError(error);
    
    // Browser compatibility errors cannot be retried
    if (category === 'browser') {
      return false;
    }

    // Permission errors need manual intervention, not automatic retry
    if (category === 'permission') {
      return false;
    }

    return true;
  }

  /**
   * Get the recommended recovery action for an error
   */
  getRecoveryAction(error: Error): RecoveryAction {
    if (error instanceof RecordingError) {
      return error.recoveryAction;
    }

    const category = this.categorizeError(error);

    switch (category) {
      case 'permission':
        return 'request_permission';
      case 'device':
        return 'change_device';
      case 'browser':
        return 'manual_intervention';
      case 'initialization':
        return 'reset';
      case 'network':
        return 'retry';
      default:
        return 'manual_intervention';
    }
  }

  /**
   * Convert a generic error to a RecordingError
   */
  toRecordingError(error: Error): RecordingError {
    if (error instanceof RecordingError) {
      return error;
    }

    const category = this.categorizeError(error);
    const userMessage = this.getUserMessage(error);
    const resolution = this.getResolutionSteps(error)[0];
    const recoveryAction = this.getRecoveryAction(error);
    const canRetry = this.canRetry(error);
    const canRecover = this.isRecoverable(error);

    // Create specific error types based on category
    switch (category) {
      case 'permission':
        return new RecordingPermissionError(error.message);
      case 'device':
        return new RecordingDeviceError(error.message);
      case 'browser':
        return new BrowserCompatibilityError(error.message, []);
      case 'initialization':
        return new RecordingInitializationError(error.message);
      case 'network':
        return new RecordingNetworkError(error.message);
      default:
        return new RecordingError(
          error.message,
          'UNKNOWN_ERROR',
          userMessage,
          resolution,
          category,
          recoveryAction,
          canRetry,
          canRecover
        );
    }
  }

  /**
   * Log an error with appropriate context
   */
  logError(error: Error, context?: Record<string, any>): void {
    const category = this.categorizeError(error);
    const userMessage = this.getUserMessage(error);
    
    console.error('[RecordingError]', {
      category,
      name: error.name,
      message: error.message,
      userMessage,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Format error for display in UI
   */
  formatErrorForDisplay(error: Error): {
    title: string;
    message: string;
    steps: string[];
    canRetry: boolean;
    severity: 'error' | 'warning' | 'info';
  } {
    const category = this.categorizeError(error);
    const userMessage = this.getUserMessage(error);
    const steps = this.getResolutionSteps(error);
    const canRetry = this.canRetry(error);

    let title = 'Recording Error';
    let severity: 'error' | 'warning' | 'info' = 'error';

    switch (category) {
      case 'permission':
        title = 'Permission Required';
        severity = 'warning';
        break;
      case 'device':
        title = 'Microphone Issue';
        break;
      case 'browser':
        title = 'Browser Not Supported';
        break;
      case 'initialization':
        title = 'Initialization Failed';
        break;
      case 'network':
        title = 'Connection Issue';
        severity = 'warning';
        break;
    }

    return {
      title,
      message: userMessage,
      steps,
      canRetry,
      severity
    };
  }
}

// Export singleton instance
export const recordingErrorHandler = new RecordingErrorHandler();
