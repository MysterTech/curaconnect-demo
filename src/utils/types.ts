/**
 * Type definitions for enhanced recording features
 */

// Permission types
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionResult {
  granted: boolean;
  state: PermissionState;
  error?: string;
  requiresManualGrant: boolean;
}

export interface PermissionInstructions {
  browser: string;
  steps: string[];
  imageUrl?: string;
  videoUrl?: string;
}

// Browser compatibility types
export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  userAgent: string;
}

export type BrowserFeature = 
  | 'getUserMedia'
  | 'mediaRecorder'
  | 'audioContext'
  | 'webAudio'
  | 'opus'
  | 'webm';

export interface BrowserSupportResult {
  supported: boolean;
  missingFeatures: string[];
  warnings: string[];
  recommendedBrowsers: string[];
}

export interface CompatibilityResult {
  isCompatible: boolean;
  browserInfo: BrowserInfo;
  supportedFeatures: BrowserFeature[];
  unsupportedFeatures: BrowserFeature[];
  warnings: string[];
  canProceedWithLimitations: boolean;
}

export interface BrowserRecommendation {
  name: string;
  minVersion: string;
  downloadUrl: string;
  features: BrowserFeature[];
}

// Recording error types
export interface RecordingError {
  code: string;
  message: string;
  userMessage: string;
  resolution?: string;
  canRetry: boolean;
  canRecover: boolean;
}

// Device types
export interface AudioDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
  isAvailable: boolean;
}

// Diagnostic types
export interface MicrophoneTestResult {
  success: boolean;
  audioLevel: number;
  deviceInfo: MediaDeviceInfo | null;
  error?: string;
}

export interface DiagnosticInfo {
  browserInfo: BrowserInfo;
  apiSupport: {
    getUserMedia: boolean;
    mediaRecorder: boolean;
    audioContext: boolean;
  };
  permissionState: PermissionState;
  availableDevices: MediaDeviceInfo[];
  currentDevice: MediaDeviceInfo | null;
}

export interface DiagnosticReport {
  timestamp: Date;
  browserSupport: BrowserSupportResult;
  permissionState: PermissionState;
  deviceInfo: DiagnosticInfo;
  recommendations: string[];
}

// Validation types
export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  resolution?: string;
}

export interface ValidationResult {
  canRecord: boolean;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface InitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

// Recovery types
export type RecoveryAction = 
  | 'retry'
  | 'reset'
  | 'request_permission'
  | 'change_device'
  | 'manual_intervention';

export interface RecoveryResult {
  recovered: boolean;
  action: RecoveryAction;
  message: string;
}

// Error category types
export type ErrorCategory = 
  | 'permission'
  | 'initialization'
  | 'device'
  | 'browser'
  | 'network'
  | 'unknown';
