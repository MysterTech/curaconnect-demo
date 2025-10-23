import { RecordingManager, RecordingManagerInterface, DiagnosticInfo, MicrophoneTestResult } from './RecordingManager';
import { RecordingState } from '../models/types';
import { RecordingError, RecordingPermissionError } from '../utils/recordingErrors';
import { recordingErrorHandler } from '../utils/RecordingErrorHandler';
import { browserCompatibilityChecker } from '../utils/BrowserCompatibilityChecker';

export interface InitializationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

export interface RecoveryResult {
  recovered: boolean;
  action: 'retry' | 'reset' | 'manual_intervention';
  message: string;
}

export interface DiagnosticReport {
  timestamp: Date;
  browserSupport: any;
  permissionState: string;
  deviceInfo: DiagnosticInfo;
  recommendations: string[];
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface RecordingControllerInterface {
  initialize(): Promise<void>;
  startRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  getState(): RecordingState;
  onStateChange(callback: (state: RecordingState) => void): void;
  onError(callback: (error: Error) => void): void;
  checkMicrophonePermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
}

export class RecordingController implements RecordingControllerInterface {
  private recordingManager: RecordingManager;
  private stateChangeCallbacks: ((state: RecordingState) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  private isInitialized = false;
  private currentState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  };

  constructor(recordingManager?: RecordingManager) {
    this.recordingManager = recordingManager || new RecordingManager();
    this.setupEventListeners();
  }

  /**
   * Initialize the recording controller
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Check if browser supports required APIs
      if (!this.checkBrowserSupport()) {
        throw new Error('Browser does not support required audio recording APIs');
      }

      this.isInitialized = true;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Initialization failed'));
      throw error;
    }
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.currentState.isRecording) {
        throw new Error('Recording is already in progress');
      }

      // Check microphone permission
      const hasPermission = await this.recordingManager.requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      await this.recordingManager.startRecording();
      this.updateState();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to start recording'));
      throw error;
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.currentState.isRecording) {
        throw new Error('No recording in progress');
      }

      if (this.currentState.isPaused) {
        throw new Error('Recording is already paused');
      }

      this.recordingManager.pauseRecording();
      this.updateState();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to pause recording'));
      throw error;
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.currentState.isRecording) {
        throw new Error('No recording in progress');
      }

      if (!this.currentState.isPaused) {
        throw new Error('Recording is not paused');
      }

      this.recordingManager.resumeRecording();
      this.updateState();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to resume recording'));
      throw error;
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    try {
      if (!this.currentState.isRecording) {
        throw new Error('No recording in progress');
      }

      const audioBlob = await this.recordingManager.stopRecording();
      this.updateState();
      return audioBlob;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to stop recording'));
      throw error;
    }
  }

  /**
   * Get current audio chunk without stopping recording
   * Used for chunked transcription
   */
  async getAudioChunk(): Promise<Blob> {
    try {
      console.log('🎵 RecordingController.getAudioChunk() called');
      
      if (!this.currentState.isRecording || this.currentState.isPaused) {
        console.log('⚠️ Not recording or paused, returning empty blob');
        return new Blob([], { type: 'audio/webm' });
      }

      // Get audio chunk from recording manager
      const audioChunk = await this.recordingManager.getAudioChunk();
      console.log(`🎵 RecordingController returned chunk: ${audioChunk.size} bytes`);
      return audioChunk;
    } catch (error) {
      console.error('❌ Error getting audio chunk:', error);
      this.handleError(error instanceof Error ? error : new Error('Failed to get audio chunk'));
      return new Blob([], { type: 'audio/webm' });
    }
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return { ...this.currentState };
  }

  /**
   * Register state change callback
   */
  onStateChange(callback: (state: RecordingState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Register error callback
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove state change callback
   */
  removeStateChangeCallback(callback: (state: RecordingState) => void): void {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Remove error callback
   */
  removeErrorCallback(callback: (error: Error) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Check microphone permission status
   */
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.permissions) {
        // Fallback: try to access microphone
        return await this.recordingManager.requestMicrophonePermission();
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return false;
    }
  }

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      return await this.recordingManager.requestMicrophonePermission();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Permission request failed'));
      return false;
    }
  }

  /**
   * Get available audio devices
   */
  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      return await this.recordingManager.getAvailableDevices();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to get audio devices'));
      return [];
    }
  }

  /**
   * Set audio input device
   */
  async setAudioDevice(deviceId: string): Promise<void> {
    try {
      await this.recordingManager.setAudioDevice(deviceId);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to set audio device'));
      throw error;
    }
  }

  /**
   * Toggle recording (start/pause/resume based on current state)
   */
  async toggleRecording(): Promise<void> {
    if (!this.currentState.isRecording) {
      await this.startRecording();
    } else if (this.currentState.isPaused) {
      await this.resumeRecording();
    } else {
      await this.pauseRecording();
    }
  }

  /**
   * Check if browser supports required APIs
   */
  private checkBrowserSupport(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      window.MediaRecorder &&
      (window.AudioContext || (window as any).webkitAudioContext)
    );
  }

  /**
   * Set up event listeners for recording manager
   */
  private setupEventListeners(): void {
    this.recordingManager.onStateChange((state) => {
      this.currentState = state;
      this.notifyStateChange();
    });
  }

  /**
   * Update current state from recording manager
   */
  private updateState(): void {
    this.currentState = this.recordingManager.getRecordingState();
    this.notifyStateChange();
  }

  /**
   * Notify state change callbacks
   */
  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * Handle and notify errors
   */
  private handleError(error: Error): void {
    console.error('RecordingController error:', error);
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  /**
   * Dispose of the controller and clean up resources
   */
  async dispose(): Promise<void> {
    try {
      if (this.currentState.isRecording) {
        await this.stopRecording();
      }
    } catch (error) {
      console.warn('Error stopping recording during disposal:', error);
    }

    await this.recordingManager.dispose();
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.isInitialized = false;
  }

  /**
   * Initialize with validation
   */
  async initializeWithValidation(): Promise<InitializationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check browser support
      const compatibility = this.recordingManager.checkBrowserSupport();
      if (!compatibility.isCompatible) {
        errors.push('Browser does not support required recording features');
        compatibility.unsupportedFeatures.forEach(feature => {
          errors.push(`Missing feature: ${feature}`);
        });
      }

      // Add warnings
      warnings.push(...compatibility.warnings);

      // Check permission
      const permissionState = await this.recordingManager.getPermissionState();
      if (permissionState === 'denied') {
        errors.push('Microphone permission is denied');
      } else if (permissionState === 'prompt') {
        warnings.push('Microphone permission needs to be requested');
      }

      // Check for audio devices
      const devices = await this.getAvailableDevices();
      if (devices.length === 0) {
        errors.push('No audio input devices found');
      }

      const canProceed = errors.length === 0;
      const success = canProceed && warnings.length === 0;

      if (canProceed) {
        this.isInitialized = true;
      }

      return {
        success,
        errors,
        warnings,
        canProceed
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Initialization failed');
      return {
        success: false,
        errors,
        warnings,
        canProceed: false
      };
    }
  }

  /**
   * Recover from an error
   */
  async recoverFromError(error: RecordingError): Promise<RecoveryResult> {
    const recoveryAction = recordingErrorHandler.getRecoveryAction(error);

    try {
      switch (recoveryAction) {
        case 'retry':
          // Try the operation again
          await this.recordingManager.resetState();
          return {
            recovered: true,
            action: 'retry',
            message: 'Ready to retry recording'
          };

        case 'reset':
          // Reset the recording state
          await this.recordingManager.resetState();
          this.currentState = {
            isRecording: false,
            isPaused: false,
            duration: 0,
            audioLevel: 0
          };
          this.notifyStateChange();
          return {
            recovered: true,
            action: 'reset',
            message: 'Recording state has been reset'
          };

        case 'request_permission':
          // Permission needs to be requested manually
          return {
            recovered: false,
            action: 'manual_intervention',
            message: 'Please grant microphone permission in your browser settings'
          };

        case 'change_device':
          // Device needs to be changed
          return {
            recovered: false,
            action: 'manual_intervention',
            message: 'Please check your microphone connection or select a different device'
          };

        default:
          return {
            recovered: false,
            action: 'manual_intervention',
            message: 'Manual intervention required'
          };
      }
    } catch (recoveryError) {
      return {
        recovered: false,
        action: 'manual_intervention',
        message: 'Recovery failed: ' + (recoveryError instanceof Error ? recoveryError.message : 'Unknown error')
      };
    }
  }

  /**
   * Run diagnostics
   */
  async runDiagnostics(): Promise<DiagnosticReport> {
    const browserSupport = this.recordingManager.checkBrowserSupport();
    const deviceInfo = await this.recordingManager.getDiagnosticInfo();
    const recommendations: string[] = [];

    // Generate recommendations
    if (!browserSupport.isCompatible) {
      recommendations.push('Update your browser or use a supported browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)');
    }

    if (deviceInfo.permissionState === 'denied') {
      recommendations.push('Grant microphone permission in your browser settings');
    }

    if (deviceInfo.availableDevices.length === 0) {
      recommendations.push('Connect a microphone to your computer');
    }

    if (browserSupport.warnings.length > 0) {
      recommendations.push(...browserSupport.warnings);
    }

    return {
      timestamp: new Date(),
      browserSupport,
      permissionState: deviceInfo.permissionState,
      deviceInfo,
      recommendations
    };
  }

  /**
   * List audio devices with additional metadata
   */
  async listAudioDevices(): Promise<AudioDevice[]> {
    const devices = await this.getAvailableDevices();
    
    return devices.map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${index + 1}`,
      isDefault: device.deviceId === 'default',
      isAvailable: true
    }));
  }

  /**
   * Select an audio device
   */
  async selectAudioDevice(deviceId: string): Promise<void> {
    await this.setAudioDevice(deviceId);
  }

  /**
   * Test an audio device
   */
  async testAudioDevice(deviceId: string): Promise<MicrophoneTestResult> {
    // Temporarily set the device
    const originalDevice = this.recordingManager.getRecordingState();
    
    try {
      await this.setAudioDevice(deviceId);
      return await this.recordingManager.testMicrophone();
    } finally {
      // Restore original device if needed
      // (In practice, we might want to keep the tested device selected)
    }
  }
}

// Export singleton instance
export const recordingController = new RecordingController();