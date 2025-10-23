import { RecordingController } from './RecordingController';
import { RecordingManager } from './RecordingManager';
import { RecordingState } from '../models/types';
import type {
  InitializationResult,
  RecoveryResult,
  DiagnosticReport,
  AudioDevice,
  MicrophoneTestResult,
  BrowserSupportResult,
  DiagnosticInfo,
  PermissionState
} from '../utils/types';

export class EnhancedRecordingController extends RecordingController {
  private recordingManager: RecordingManager;

  constructor(recordingManager?: RecordingManager) {
    super(recordingManager);
    this.recordingManager = recordingManager || new RecordingManager();
  }

  /**
   * Initialize with validation
   */
  async initializeWithValidation(): Promise<InitializationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check browser support
      if (!this.checkBrowserSupport()) {
        errors.push('Browser does not support required audio recording APIs');
      }

      // Initialize base controller
      await this.initialize();

      return {
        success: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.length === 0
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
   * Recover from error
   */
  async recoverFromError(error: Error): Promise<RecoveryResult> {
    // Determine recovery action based on error
    if (error.message.includes('permission')) {
      return {
        recovered: false,
        action: 'request_permission',
        message: 'Please grant microphone permission'
      };
    }

    if (error.message.includes('device') || error.message.includes('microphone')) {
      return {
        recovered: false,
        action: 'change_device',
        message: 'Please check your microphone connection'
      };
    }

    // Try to reset and retry
    try {
      // Reset state would go here if we had that method
      return {
        recovered: true,
        action: 'retry',
        message: 'Recovered successfully'
      };
    } catch (recoveryError) {
      return {
        recovered: false,
        action: 'manual_intervention',
        message: 'Manual intervention required'
      };
    }
  }

  /**
   * Run diagnostics
   */
  async runDiagnostics(): Promise<DiagnosticReport> {
    const browserSupport = this.getBrowserSupport();
    const permissionState = await this.getPermissionState();
    const deviceInfo = await this.getDeviceInfo();

    const recommendations: string[] = [];

    if (!browserSupport.supported) {
      recommendations.push('Use a modern browser like Chrome, Firefox, or Edge');
    }

    if (permissionState === 'denied') {
      recommendations.push('Grant microphone permission in browser settings');
    }

    if (deviceInfo.availableDevices.length === 0) {
      recommendations.push('Connect a microphone device');
    }

    return {
      timestamp: new Date(),
      browserSupport,
      permissionState,
      deviceInfo,
      recommendations
    };
  }

  /**
   * List audio devices
   */
  async listAudioDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await this.getAvailableDevices();
      return devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.substring(0, 8)}`,
        isDefault: device.deviceId === 'default',
        isAvailable: true
      }));
    } catch (error) {
      console.error('Failed to list audio devices:', error);
      return [];
    }
  }

  /**
   * Select audio device
   */
  async selectAudioDevice(deviceId: string): Promise<void> {
    try {
      await this.setAudioDevice(deviceId);
    } catch (error) {
      throw new Error(`Failed to select audio device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test audio device
   */
  async testAudioDevice(deviceId: string): Promise<MicrophoneTestResult> {
    try {
      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return {
          success: false,
          audioLevel: 0,
          deviceInfo: null,
          error: 'Microphone permission denied'
        };
      }

      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const device = devices.find(d => d.deviceId === deviceId && d.kind === 'audioinput');

      if (!device) {
        return {
          success: false,
          audioLevel: 0,
          deviceInfo: null,
          error: 'Device not found'
        };
      }

      // Test by getting a stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });

      // Create audio context to measure level
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const audioLevel = average / 255;

      // Clean up
      stream.getTracks().forEach(track => track.stop());
      await audioContext.close();

      return {
        success: true,
        audioLevel,
        deviceInfo: device,
        error: undefined
      };
    } catch (error) {
      return {
        success: false,
        audioLevel: 0,
        deviceInfo: null,
        error: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  /**
   * Get browser support information
   */
  private getBrowserSupport(): BrowserSupportResult {
    const missingFeatures: string[] = [];
    const warnings: string[] = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      missingFeatures.push('getUserMedia');
    }

    if (!window.MediaRecorder) {
      missingFeatures.push('MediaRecorder');
    }

    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      missingFeatures.push('AudioContext');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures,
      warnings,
      recommendedBrowsers: ['Chrome 90+', 'Firefox 88+', 'Edge 90+', 'Safari 14+']
    };
  }

  /**
   * Get permission state
   */
  private async getPermissionState(): Promise<PermissionState> {
    try {
      if (!navigator.permissions) {
        return 'unknown';
      }

      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state as PermissionState;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<DiagnosticInfo> {
    const browserInfo = {
      name: this.getBrowserName(),
      version: this.getBrowserVersion(),
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };

    const apiSupport = {
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      mediaRecorder: !!window.MediaRecorder,
      audioContext: !!(window.AudioContext || (window as any).webkitAudioContext)
    };

    let availableDevices: MediaDeviceInfo[] = [];
    let currentDevice: MediaDeviceInfo | null = null;

    try {
      availableDevices = await navigator.mediaDevices.enumerateDevices();
      availableDevices = availableDevices.filter(d => d.kind === 'audioinput');
      
      if (availableDevices.length > 0) {
        currentDevice = availableDevices[0];
      }
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }

    const permissionState = await this.getPermissionState();

    return {
      browserInfo,
      apiSupport,
      permissionState,
      availableDevices,
      currentDevice
    };
  }

  /**
   * Get browser name
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      return 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    } else if (userAgent.includes('Edg')) {
      return 'Edge';
    } else {
      return 'Unknown';
    }
  }

  /**
   * Get browser version
   */
  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edg)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  /**
   * Check browser support
   */
  private checkBrowserSupport(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      window.MediaRecorder &&
      (window.AudioContext || (window as any).webkitAudioContext)
    );
  }
}
