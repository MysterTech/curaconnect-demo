/**
 * Custom error classes for recording-specific errors
 * Provides user-friendly messages and resolution steps
 */

export type ErrorCategory = 
  | 'permission'
  | 'initialization'
  | 'device'
  | 'browser'
  | 'network'
  | 'unknown';

export type RecoveryAction = 
  | 'retry'
  | 'reset'
  | 'request_permission'
  | 'change_device'
  | 'manual_intervention';

/**
 * Base class for all recording errors
 */
export class RecordingError extends Error {
  code: string;
  userMessage: string;
  resolution: string;
  canRetry: boolean;
  canRecover: boolean;
  category: ErrorCategory;
  recoveryAction: RecoveryAction;

  constructor(
    message: string,
    code: string,
    userMessage: string,
    resolution: string,
    category: ErrorCategory,
    recoveryAction: RecoveryAction,
    canRetry: boolean = false,
    canRecover: boolean = false
  ) {
    super(message);
    this.name = 'RecordingError';
    this.code = code;
    this.userMessage = userMessage;
    this.resolution = resolution;
    this.category = category;
    this.recoveryAction = recoveryAction;
    this.canRetry = canRetry;
    this.canRecover = canRecover;
  }
}

/**
 * Error thrown when microphone permission is denied
 */
export class RecordingPermissionError extends RecordingError {
  constructor(message: string = 'Microphone permission denied') {
    super(
      message,
      'PERMISSION_DENIED',
      'Microphone access was denied',
      'Please grant microphone permission in your browser settings and refresh the page',
      'permission',
      'request_permission',
      true,
      true
    );
    this.name = 'RecordingPermissionError';
  }
}

/**
 * Error thrown when recording initialization fails
 */
export class RecordingInitializationError extends RecordingError {
  details: any;

  constructor(message: string, details?: any) {
    super(
      message,
      'INITIALIZATION_FAILED',
      'Failed to initialize recording',
      'Please refresh the page and try again. If the problem persists, check your browser settings.',
      'initialization',
      'reset',
      true,
      true
    );
    this.name = 'RecordingInitializationError';
    this.details = details;
  }
}

/**
 * Error thrown when browser doesn't support required features
 */
export class BrowserCompatibilityError extends RecordingError {
  missingFeatures: string[];

  constructor(message: string, missingFeatures: string[]) {
    super(
      message,
      'BROWSER_UNSUPPORTED',
      'Your browser does not support audio recording',
      'Please use a modern browser like Chrome (version 90+), Firefox (version 88+), Safari (version 14+), or Edge (version 90+)',
      'browser',
      'manual_intervention',
      false,
      false
    );
    this.name = 'BrowserCompatibilityError';
    this.missingFeatures = missingFeatures;
  }
}

/**
 * Error thrown when there's an issue with the audio device
 */
export class RecordingDeviceError extends RecordingError {
  deviceInfo?: MediaDeviceInfo;

  constructor(message: string, deviceInfo?: MediaDeviceInfo) {
    super(
      message,
      'DEVICE_ERROR',
      'Microphone device error',
      'Please check your microphone connection and ensure it is properly configured in your system settings',
      'device',
      'change_device',
      true,
      true
    );
    this.name = 'RecordingDeviceError';
    this.deviceInfo = deviceInfo;
  }
}

/**
 * Error thrown when no audio devices are found
 */
export class NoAudioDeviceError extends RecordingError {
  constructor(message: string = 'No audio input devices found') {
    super(
      message,
      'NO_DEVICE',
      'No microphone detected',
      'Please connect a microphone to your computer and refresh the page',
      'device',
      'manual_intervention',
      true,
      false
    );
    this.name = 'NoAudioDeviceError';
  }
}

/**
 * Error thrown when recording is in an invalid state
 */
export class RecordingStateError extends RecordingError {
  currentState: string;

  constructor(message: string, currentState: string) {
    super(
      message,
      'INVALID_STATE',
      'Recording is in an invalid state',
      'Please stop the current recording and try again',
      'unknown',
      'reset',
      true,
      true
    );
    this.name = 'RecordingStateError';
    this.currentState = currentState;
  }
}

/**
 * Error thrown when network issues prevent recording
 */
export class RecordingNetworkError extends RecordingError {
  constructor(message: string) {
    super(
      message,
      'NETWORK_ERROR',
      'Network connection issue',
      'Please check your internet connection and try again',
      'network',
      'retry',
      true,
      true
    );
    this.name = 'RecordingNetworkError';
  }
}
