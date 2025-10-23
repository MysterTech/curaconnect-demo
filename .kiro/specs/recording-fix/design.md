# Design Document: Recording Feature Fix

## Overview

This design document outlines the technical approach to fix the recording feature in MedScribe. The solution focuses on improving error handling, permission management, service initialization, and user feedback to ensure reliable audio recording functionality.

### Problem Statement

The current recording implementation has several issues:
1. Insufficient error handling and user feedback
2. Missing browser compatibility checks
3. Inadequate permission request flow
4. Lack of initialization validation
5. Poor error recovery mechanisms

### Solution Approach

We will enhance the existing recording infrastructure by:
- Adding comprehensive error handling at each layer
- Implementing proper permission management flow
- Adding browser compatibility detection
- Improving service initialization with validation
- Enhancing user feedback with actionable error messages
- Adding diagnostic logging for troubleshooting

## Architecture

### Component Hierarchy

```
ActiveSession (Page)
    ↓
SessionManager (Orchestrator)
    ↓
RecordingController (Controller Layer)
    ↓
RecordingManager (Service Layer)
    ↓
Browser APIs (MediaRecorder, getUserMedia, AudioContext)
```

### Data Flow

```
User Action → UI Component → SessionManager → RecordingController → RecordingManager → Browser API
                                                                                            ↓
Error/Success ← UI Update ← State Update ← Event Callback ← Service Response ← API Response
```

## Components and Interfaces

### 1. Enhanced RecordingManager

**Purpose:** Low-level recording service with improved error handling and diagnostics

**New Methods:**
```typescript
interface EnhancedRecordingManager extends RecordingManager {
  // Diagnostic methods
  checkBrowserSupport(): BrowserSupportResult;
  testMicrophone(): Promise<MicrophoneTestResult>;
  getDiagnosticInfo(): DiagnosticInfo;
  
  // Permission management
  getPermissionState(): Promise<PermissionState>;
  requestPermissionWithFallback(): Promise<PermissionResult>;
  
  // Error recovery
  resetState(): Promise<void>;
  retryOperation(operation: () => Promise<void>, maxRetries: number): Promise<void>;
}

interface BrowserSupportResult {
  supported: boolean;
  missingFeatures: string[];
  warnings: string[];
  recommendedBrowsers: string[];
}

interface MicrophoneTestResult {
  success: boolean;
  audioLevel: number;
  deviceInfo: MediaDeviceInfo | null;
  error?: string;
}

interface DiagnosticInfo {
  browserInfo: {
    name: string;
    version: string;
    platform: string;
  };
  apiSupport: {
    getUserMedia: boolean;
    mediaRecorder: boolean;
    audioContext: boolean;
  };
  permissionState: PermissionState;
  availableDevices: MediaDeviceInfo[];
  currentDevice: MediaDeviceInfo | null;
}

interface PermissionResult {
  granted: boolean;
  state: PermissionState;
  error?: string;
  requiresManualGrant: boolean;
}
```

**Key Enhancements:**
- Browser compatibility detection
- Microphone testing before recording
- Detailed diagnostic information
- Permission state management
- Retry logic for transient failures

### 2. Enhanced RecordingController

**Purpose:** Controller layer with improved error handling and state management

**New Methods:**
```typescript
interface EnhancedRecordingController extends RecordingController {
  // Initialization with validation
  initializeWithValidation(): Promise<InitializationResult>;
  
  // Error recovery
  recoverFromError(error: RecordingError): Promise<RecoveryResult>;
  
  // Diagnostics
  runDiagnostics(): Promise<DiagnosticReport>;
  
  // Device management
  listAudioDevices(): Promise<AudioDevice[]>;
  selectAudioDevice(deviceId: string): Promise<void>;
  testAudioDevice(deviceId: string): Promise<MicrophoneTestResult>;
}

interface InitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

interface RecoveryResult {
  recovered: boolean;
  action: 'retry' | 'reset' | 'manual_intervention';
  message: string;
}

interface DiagnosticReport {
  timestamp: Date;
  browserSupport: BrowserSupportResult;
  permissionState: PermissionState;
  deviceInfo: DiagnosticInfo;
  recommendations: string[];
}

interface AudioDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
  isAvailable: boolean;
}
```

**Key Enhancements:**
- Validation during initialization
- Automatic error recovery
- Comprehensive diagnostics
- Device management UI support

### 3. Enhanced SessionManager

**Purpose:** High-level orchestration with better error propagation

**New Methods:**
```typescript
interface EnhancedSessionManager extends SessionManager {
  // Pre-flight checks
  validateRecordingCapability(): Promise<ValidationResult>;
  
  // Error handling
  handleRecordingError(error: Error, sessionId: string): Promise<void>;
  
  // Recovery
  recoverSession(sessionId: string): Promise<Session>;
}

interface ValidationResult {
  canRecord: boolean;
  issues: ValidationIssue[];
  recommendations: string[];
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  resolution?: string;
}
```

### 4. New Component: PermissionManager

**Purpose:** Centralized permission management

```typescript
class PermissionManager {
  // Check current permission state
  async checkPermission(): Promise<PermissionState>;
  
  // Request permission with user-friendly flow
  async requestPermission(): Promise<PermissionResult>;
  
  // Handle permission denial
  getPermissionInstructions(browser: string): PermissionInstructions;
  
  // Monitor permission changes
  onPermissionChange(callback: (state: PermissionState) => void): void;
}

interface PermissionInstructions {
  browser: string;
  steps: string[];
  imageUrl?: string;
  videoUrl?: string;
}

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';
```

### 5. New Component: BrowserCompatibilityChecker

**Purpose:** Detect and report browser compatibility issues

```typescript
class BrowserCompatibilityChecker {
  // Check if browser is supported
  checkCompatibility(): CompatibilityResult;
  
  // Get browser information
  getBrowserInfo(): BrowserInfo;
  
  // Check specific features
  checkFeature(feature: BrowserFeature): boolean;
  
  // Get recommended browsers
  getRecommendedBrowsers(): BrowserRecommendation[];
}

interface CompatibilityResult {
  isCompatible: boolean;
  browserInfo: BrowserInfo;
  supportedFeatures: BrowserFeature[];
  unsupportedFeatures: BrowserFeature[];
  warnings: string[];
  canProceedWithLimitations: boolean;
}

interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  userAgent: string;
}

type BrowserFeature = 
  | 'getUserMedia'
  | 'mediaRecorder'
  | 'audioContext'
  | 'webAudio'
  | 'opus'
  | 'webm';

interface BrowserRecommendation {
  name: string;
  minVersion: string;
  downloadUrl: string;
  features: BrowserFeature[];
}
```

### 6. Enhanced UI Components

#### RecordingControls Enhancement

**New Props:**
```typescript
interface EnhancedRecordingControlsProps extends RecordingControlsProps {
  // Permission state
  permissionState: PermissionState;
  onRequestPermission: () => Promise<void>;
  
  // Error handling
  error: RecordingError | null;
  onRetry: () => Promise<void>;
  onDismissError: () => void;
  
  // Diagnostics
  onRunDiagnostics: () => Promise<void>;
  
  // Device selection
  availableDevices: AudioDevice[];
  selectedDevice: AudioDevice | null;
  onSelectDevice: (deviceId: string) => Promise<void>;
}

interface RecordingError {
  code: string;
  message: string;
  userMessage: string;
  resolution?: string;
  canRetry: boolean;
  canRecover: boolean;
}
```

#### New Component: PermissionPrompt

```typescript
interface PermissionPromptProps {
  isOpen: boolean;
  permissionState: PermissionState;
  onRequestPermission: () => Promise<void>;
  onClose: () => void;
  instructions?: PermissionInstructions;
}
```

#### New Component: BrowserCompatibilityWarning

```typescript
interface BrowserCompatibilityWarningProps {
  compatibilityResult: CompatibilityResult;
  onDismiss: () => void;
  onViewDetails: () => void;
}
```

#### New Component: RecordingDiagnostics

```typescript
interface RecordingDiagnosticsProps {
  isOpen: boolean;
  diagnosticReport: DiagnosticReport | null;
  onClose: () => void;
  onRunTest: () => Promise<void>;
  onCopyReport: () => void;
}
```

## Data Models

### New Error Types

```typescript
// Specific error types for better handling
export class RecordingPermissionError extends Error {
  code = 'PERMISSION_DENIED';
  userMessage: string;
  resolution: string;
  
  constructor(message: string) {
    super(message);
    this.name = 'RecordingPermissionError';
    this.userMessage = 'Microphone access was denied';
    this.resolution = 'Please grant microphone permission in your browser settings';
  }
}

export class RecordingInitializationError extends Error {
  code = 'INITIALIZATION_FAILED';
  userMessage: string;
  resolution: string;
  details: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'RecordingInitializationError';
    this.userMessage = 'Failed to initialize recording';
    this.resolution = 'Please refresh the page and try again';
    this.details = details;
  }
}

export class BrowserCompatibilityError extends Error {
  code = 'BROWSER_UNSUPPORTED';
  userMessage: string;
  resolution: string;
  missingFeatures: string[];
  
  constructor(message: string, missingFeatures: string[]) {
    super(message);
    this.name = 'BrowserCompatibilityError';
    this.userMessage = 'Your browser does not support audio recording';
    this.resolution = 'Please use a modern browser like Chrome, Firefox, or Edge';
    this.missingFeatures = missingFeatures;
  }
}

export class RecordingDeviceError extends Error {
  code = 'DEVICE_ERROR';
  userMessage: string;
  resolution: string;
  deviceInfo?: MediaDeviceInfo;
  
  constructor(message: string, deviceInfo?: MediaDeviceInfo) {
    super(message);
    this.name = 'RecordingDeviceError';
    this.userMessage = 'Microphone device error';
    this.resolution = 'Please check your microphone connection and try again';
    this.deviceInfo = deviceInfo;
  }
}
```

### Enhanced RecordingState

```typescript
export interface EnhancedRecordingState extends RecordingState {
  // Additional state information
  permissionState: PermissionState;
  initializationStatus: 'pending' | 'initializing' | 'ready' | 'error';
  error: RecordingError | null;
  
  // Device information
  selectedDevice: AudioDevice | null;
  availableDevices: AudioDevice[];
  
  // Diagnostics
  lastDiagnosticRun?: Date;
  diagnosticReport?: DiagnosticReport;
}
```

## Error Handling

### Error Handling Strategy

```typescript
class RecordingErrorHandler {
  // Categorize errors
  categorizeError(error: Error): ErrorCategory;
  
  // Get user-friendly message
  getUserMessage(error: Error): string;
  
  // Get resolution steps
  getResolutionSteps(error: Error): string[];
  
  // Determine if error is recoverable
  isRecoverable(error: Error): boolean;
  
  // Get recovery action
  getRecoveryAction(error: Error): RecoveryAction;
}

type ErrorCategory = 
  | 'permission'
  | 'initialization'
  | 'device'
  | 'browser'
  | 'network'
  | 'unknown';

type RecoveryAction = 
  | 'retry'
  | 'reset'
  | 'request_permission'
  | 'change_device'
  | 'manual_intervention';
```

### Error Flow

```
Error Occurs
    ↓
RecordingManager catches error
    ↓
Error passed to RecordingController
    ↓
RecordingController categorizes error
    ↓
Error passed to SessionManager
    ↓
SessionManager updates session state
    ↓
UI displays user-friendly error message
    ↓
User takes action (retry, change settings, etc.)
```

## Testing Strategy

### Unit Tests

1. **RecordingManager Tests**
   - Browser support detection
   - Permission request handling
   - Error scenarios (permission denied, device not found, etc.)
   - State management
   - Audio level monitoring

2. **RecordingController Tests**
   - Initialization validation
   - Error recovery logic
   - Device management
   - State transitions

3. **PermissionManager Tests**
   - Permission state detection
   - Permission request flow
   - Instruction generation for different browsers

4. **BrowserCompatibilityChecker Tests**
   - Feature detection
   - Browser identification
   - Compatibility result generation

### Integration Tests

1. **Recording Flow Tests**
   - Complete recording lifecycle (start → pause → resume → stop)
   - Error handling during recording
   - Permission request flow
   - Device switching during recording

2. **Session Management Tests**
   - Session creation with recording
   - Session recovery after error
   - Auto-save during recording

### Manual Testing Scenarios

1. **Permission Scenarios**
   - First-time permission request
   - Permission denied
   - Permission revoked during recording
   - Permission granted after denial

2. **Device Scenarios**
   - No microphone connected
   - Multiple microphones available
   - Microphone disconnected during recording
   - Switching devices mid-recording

3. **Browser Scenarios**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
   - Unsupported browsers

4. **Error Recovery Scenarios**
   - Network interruption
   - Browser tab backgrounded
   - System audio device changes
   - Low memory conditions

## Implementation Phases

### Phase 1: Core Error Handling (Priority: High)
- Implement enhanced error types
- Add error categorization
- Improve error messages
- Add basic recovery logic

### Phase 2: Permission Management (Priority: High)
- Implement PermissionManager
- Add permission request flow
- Create PermissionPrompt component
- Add browser-specific instructions

### Phase 3: Browser Compatibility (Priority: High)
- Implement BrowserCompatibilityChecker
- Add feature detection
- Create compatibility warning component
- Add fallback strategies

### Phase 4: Diagnostics (Priority: Medium)
- Add diagnostic methods to RecordingManager
- Implement diagnostic report generation
- Create RecordingDiagnostics component
- Add logging infrastructure

### Phase 5: Device Management (Priority: Medium)
- Enhance device selection UI
- Add device testing functionality
- Implement device switching
- Add device status monitoring

### Phase 6: Polish and Testing (Priority: Medium)
- Comprehensive testing
- User feedback improvements
- Performance optimization
- Documentation updates

## Security Considerations

1. **Permission Handling**
   - Never store permission state persistently
   - Always re-check permissions before recording
   - Respect user's permission denial

2. **Audio Data**
   - Audio data stays in browser memory
   - No automatic uploads without user consent
   - Clear audio data on session end

3. **Error Logging**
   - Don't log sensitive patient information
   - Sanitize error messages before logging
   - Use secure logging endpoints if remote logging is added

## Performance Considerations

1. **Initialization**
   - Lazy load recording services
   - Cache browser compatibility results
   - Minimize permission checks

2. **Audio Processing**
   - Use Web Workers for audio analysis if needed
   - Optimize audio level monitoring frequency
   - Implement efficient buffer management

3. **Error Handling**
   - Avoid excessive retries
   - Implement exponential backoff
   - Cache diagnostic results

## Accessibility

1. **Screen Reader Support**
   - Announce recording state changes
   - Provide text alternatives for visual indicators
   - Ensure error messages are announced

2. **Keyboard Navigation**
   - All controls accessible via keyboard
   - Clear focus indicators
   - Logical tab order

3. **Visual Feedback**
   - High contrast error messages
   - Clear status indicators
   - Support for reduced motion preferences

## Monitoring and Logging

### Logging Strategy

```typescript
interface RecordingLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  category: 'permission' | 'initialization' | 'recording' | 'device';
  message: string;
  details?: any;
  sessionId?: string;
}

class RecordingLogger {
  log(level: string, category: string, message: string, details?: any): void;
  getRecentLogs(count: number): RecordingLog[];
  exportLogs(): string;
  clearLogs(): void;
}
```

### Metrics to Track

1. **Success Rates**
   - Recording initialization success rate
   - Permission grant rate
   - Recording completion rate

2. **Error Rates**
   - Error frequency by type
   - Recovery success rate
   - Browser-specific error rates

3. **Performance**
   - Initialization time
   - Time to first audio capture
   - Audio processing latency

## Migration Strategy

1. **Backward Compatibility**
   - Maintain existing API interfaces
   - Add new methods without breaking changes
   - Gradual rollout of new features

2. **Deployment**
   - Deploy error handling first
   - Add permission management
   - Roll out diagnostics last

3. **Rollback Plan**
   - Feature flags for new functionality
   - Ability to disable enhanced error handling
   - Fallback to basic recording if needed
