import { RecordingState } from "../models/types";
import { PermissionManager } from "../utils/PermissionManager";
import type { PermissionState } from "../utils/types";
import {
  RecordingPermissionError,
  RecordingDeviceError,
  NoAudioDeviceError,
} from "../utils/recordingErrors";
import { BrowserCompatibilityChecker } from "../utils/BrowserCompatibilityChecker";
import type { BrowserSupportResult, CompatibilityResult } from "../utils/types";

export interface MicrophoneTestResult {
  success: boolean;
  audioLevel: number;
  deviceInfo: MediaDeviceInfo | null;
  error?: string;
}
export interface DiagnosticInfo {
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
  supportedMimeTypes: string[];
}

export interface RecordingManagerInterface {
  startRecording(): Promise<void>;
  pauseRecording(): void;
  resumeRecording(): void;
  stopRecording(): Promise<Blob>;
  getAudioChunk(): Promise<Blob>;
  getRecordingState(): RecordingState;
  onAudioData(callback: (audioData: Float32Array) => void): void;
  onStateChange(callback: (state: RecordingState) => void): void;
  requestMicrophonePermission(): Promise<boolean>;
  getAvailableDevices(): Promise<MediaDeviceInfo[]>;
  setAudioDevice(deviceId: string): Promise<void>;
}

export interface RecordingOptions {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  deviceId?: string;
}

export class RecordingManager implements RecordingManagerInterface {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private recordedChunks: Blob[] = [];
  private lastChunkIndex = 0; // Track which chunks we've already sent
  private isRecording = false;
  private isPaused = false;
  private startTime = 0;
  private pausedDuration = 0;
  private lastPauseTime = 0;
  private audioLevel = 0;
  private animationFrameId: number | null = null;

  // Event callbacks
  private audioDataCallbacks: ((audioData: Float32Array) => void)[] = [];
  private stateChangeCallbacks: ((state: RecordingState) => void)[] = [];

  // Permission manager
  private permissionManager: PermissionManager;

  // Configuration
  private options: RecordingOptions = {
    sampleRate: 44100,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  constructor(options?: RecordingOptions, permissionMgr?: PermissionManager) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.permissionManager = permissionMgr || new PermissionManager();
  }

  /**
   * Request microphone permission from the user
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      // Use PermissionManager to handle permission request
      const result = await this.permissionManager.requestPermission();
      return result.granted;
    } catch (error) {
      console.error("Microphone permission denied or error:", error);
      return false;
    }
  }

  /**
   * Get current permission state
   */
  async getPermissionState(): Promise<PermissionState> {
    return await this.permissionManager.checkPermission();
  }

  /**
   * Get available audio input devices
   */
  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "audioinput");
    } catch (error) {
      console.error("Error getting audio devices:", error);
      return [];
    }
  }

  /**
   * Set the audio input device
   */
  async setAudioDevice(deviceId: string): Promise<void> {
    this.options.deviceId = deviceId;

    // If currently recording, restart with new device
    if (this.isRecording) {
      const wasRecording = !this.isPaused;
      await this.stopRecording();
      if (wasRecording) {
        await this.startRecording();
      }
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        throw new Error("Recording is already in progress");
      }

      // Check and validate permission before starting
      const permissionState = await this.permissionManager.checkPermission();
      if (permissionState === "denied") {
        throw new RecordingPermissionError(
          "Microphone permission is denied. Please grant permission in your browser settings."
        );
      }

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices
        .getUserMedia({
          audio: {
            sampleRate: this.options.sampleRate,
            channelCount: this.options.channelCount,
            echoCancellation: this.options.echoCancellation,
            noiseSuppression: this.options.noiseSuppression,
            autoGainControl: this.options.autoGainControl,
            deviceId: this.options.deviceId
              ? { exact: this.options.deviceId }
              : undefined,
          },
        })
        .catch((error) => {
          // Convert getUserMedia errors to RecordingPermissionError
          if (
            error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError"
          ) {
            throw new RecordingPermissionError(
              "Microphone permission was denied"
            );
          }
          throw error;
        });

      // Set up audio context for analysis
      await this.setupAudioContext();

      // Set up MediaRecorder
      await this.setupMediaRecorder();

      // Start recording
      this.mediaRecorder!.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.isPaused = false;
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.recordedChunks = [];

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      this.notifyStateChange();
    } catch (error) {
      await this.cleanup();
      throw new Error(
        `Failed to start recording: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.isRecording || this.isPaused) {
      throw new Error(
        "Cannot pause: not currently recording or already paused"
      );
    }

    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.lastPauseTime = Date.now();
      this.stopAudioLevelMonitoring();
      this.notifyStateChange();
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.isRecording || !this.isPaused) {
      throw new Error("Cannot resume: not currently paused");
    }

    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.pausedDuration += Date.now() - this.lastPauseTime;
      this.startAudioLevelMonitoring();
      this.notifyStateChange();
    }
  }

  /**
   * Stop recording and return the recorded audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording) {
        reject(new Error("No recording in progress"));
        return;
      }

      if (!this.mediaRecorder) {
        reject(new Error("MediaRecorder not initialized"));
        return;
      }

      // Set up event handler for when recording stops
      const handleStop = () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.addEventListener("stop", handleStop, { once: true });

      // Stop the recording
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      } else {
        handleStop();
      }

      this.isRecording = false;
      this.isPaused = false;
      this.lastChunkIndex = 0; // Reset for next recording
      this.stopAudioLevelMonitoring();
      this.notifyStateChange();
    });
  }

  /**
   * Get current audio chunk without stopping recording
   * Returns the COMPLETE audio from start (not incremental)
   * This is necessary because WebM format requires proper headers
   */
  async getAudioChunk(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.isRecording || this.isPaused) {
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }

      if (this.recordedChunks.length === 0) {
        console.log(`📦 getAudioChunk: No chunks recorded yet`);
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }

      // Check if we have new chunks since last call
      if (this.lastChunkIndex >= this.recordedChunks.length) {
        console.log(
          `📦 getAudioChunk: No new chunks (have ${this.recordedChunks.length}, last sent ${this.lastChunkIndex})`
        );
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }

      // Return COMPLETE audio from start (WebM needs proper headers)
      // We'll track what's been transcribed on the SessionManager side
      const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
      this.lastChunkIndex = this.recordedChunks.length;

      console.log(
        `📦 getAudioChunk: Created complete audio blob: ${blob.size} bytes from ${this.recordedChunks.length} chunks`
      );

      resolve(blob);
    });
  }

  /**
   * Get current recording state
   */
  getRecordingState(): RecordingState {
    const currentTime = Date.now();
    let duration = 0;

    if (this.isRecording) {
      duration = (currentTime - this.startTime - this.pausedDuration) / 1000;
      if (this.isPaused) {
        duration =
          (this.lastPauseTime - this.startTime - this.pausedDuration) / 1000;
      }
    }

    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: Math.max(0, duration),
      audioLevel: this.audioLevel,
    };
  }

  /**
   * Register callback for audio data updates
   */
  onAudioData(callback: (audioData: Float32Array) => void): void {
    this.audioDataCallbacks.push(callback);
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: RecordingState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Remove audio data callback
   */
  removeAudioDataCallback(callback: (audioData: Float32Array) => void): void {
    const index = this.audioDataCallbacks.indexOf(callback);
    if (index > -1) {
      this.audioDataCallbacks.splice(index, 1);
    }
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
   * Set up audio context for real-time analysis
   */
  private async setupAudioContext(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error("Media stream not available");
    }

    // Create audio context
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Resume context if suspended (required by some browsers)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Create source node from media stream
    this.sourceNode = this.audioContext.createMediaStreamSource(
      this.mediaStream
    );

    // Create analyser node for audio level monitoring
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Connect nodes
    this.sourceNode.connect(this.analyserNode);
  }

  /**
   * Set up MediaRecorder for audio capture
   */
  private async setupMediaRecorder(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error("Media stream not available");
    }

    // Determine the best MIME type
    const mimeType = this.getSupportedMimeType();

    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });

    // Handle data available events
    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);

        // Convert blob to audio data for callbacks
        this.processAudioChunk(event.data);
      }
    });

    // Handle errors
    this.mediaRecorder.addEventListener("error", (event) => {
      console.error("MediaRecorder error:", event);
      this.cleanup();
    });
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ""; // Let MediaRecorder choose default
  }

  /**
   * Start monitoring audio levels
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      if (!this.analyserNode || !this.isRecording || this.isPaused) {
        return;
      }

      this.analyserNode.getByteFrequencyData(dataArray);

      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }

      const rms = Math.sqrt(sum / bufferLength);
      this.audioLevel = rms / 255; // Normalize to 0-1

      // Notify callbacks with audio data
      const audioData = new Float32Array(dataArray.length);
      for (let i = 0; i < dataArray.length; i++) {
        audioData[i] = dataArray[i] / 255; // Normalize to 0-1
      }

      this.notifyAudioDataCallbacks(audioData);

      this.animationFrameId = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  }

  /**
   * Stop monitoring audio levels
   */
  private stopAudioLevelMonitoring(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.audioLevel = 0;
  }

  /**
   * Process audio chunk for real-time callbacks
   */
  private async processAudioChunk(blob: Blob): Promise<void> {
    try {
      // This is a simplified version - in a real implementation,
      // you might want to decode the audio data for more detailed analysis
      const arrayBuffer = await blob.arrayBuffer();
      const audioData = new Float32Array(arrayBuffer.byteLength / 4);

      // This is a placeholder - actual audio decoding would require
      // more sophisticated processing or a library like Web Audio API
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.random() * 0.1; // Placeholder data
      }

      this.notifyAudioDataCallbacks(audioData);
    } catch (error) {
      console.warn("Error processing audio chunk:", error);
    }
  }

  /**
   * Notify audio data callbacks
   */
  private notifyAudioDataCallbacks(audioData: Float32Array): void {
    this.audioDataCallbacks.forEach((callback) => {
      try {
        callback(audioData);
      } catch (error) {
        console.error("Error in audio data callback:", error);
      }
    });
  }

  /**
   * Notify state change callbacks
   */
  private notifyStateChange(): void {
    const state = this.getRecordingState();
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error("Error in state change callback:", error);
      }
    });
  }

  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
    this.stopAudioLevelMonitoring();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.isRecording = false;
    this.isPaused = false;
    this.audioLevel = 0;
  }

  /**
   * Dispose of the recording manager and clean up all resources
   */
  async dispose(): Promise<void> {
    await this.cleanup();
    this.audioDataCallbacks = [];
    this.stateChangeCallbacks = [];
  }

  /**
   * Check browser support for recording features
   */
  checkBrowserSupport(): CompatibilityResult {
    const checker = new BrowserCompatibilityChecker();
    return checker.checkCompatibility();
  }

  /**
   * Test microphone functionality
   */
  async testMicrophone(): Promise<MicrophoneTestResult> {
    try {
      // Check permission first
      const permissionState = await this.permissionManager.checkPermission();
      if (permissionState === "denied") {
        return {
          success: false,
          audioLevel: 0,
          deviceInfo: null,
          error: "Microphone permission is denied",
        };
      }

      // Try to get a test stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Get device info
      const tracks = stream.getAudioTracks();
      const deviceInfo =
        tracks.length > 0
          ? {
              deviceId: tracks[0].getSettings().deviceId || "",
              kind: "audioinput" as MediaDeviceKind,
              label: tracks[0].label,
              groupId: tracks[0].getSettings().groupId || "",
              toJSON: () => ({}),
            }
          : null;

      // Test audio level
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Wait a bit and measure audio level
      await new Promise((resolve) => setTimeout(resolve, 500));
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const audioLevel = Math.sqrt(sum / dataArray.length) / 255;

      // Clean up
      source.disconnect();
      analyser.disconnect();
      await audioContext.close();
      stream.getTracks().forEach((track) => track.stop());

      return {
        success: true,
        audioLevel,
        deviceInfo,
        error: undefined,
      };
    } catch (error) {
      return {
        success: false,
        audioLevel: 0,
        deviceInfo: null,
        error:
          error instanceof Error ? error.message : "Microphone test failed",
      };
    }
  }

  /**
   * Get diagnostic information
   */
  async getDiagnosticInfo(): Promise<DiagnosticInfo> {
    const checker = new BrowserCompatibilityChecker();
    const browserInfo = checker.getBrowserInfo();
    const permissionState = await this.permissionManager.checkPermission();
    const availableDevices = await this.getAvailableDevices();
    const supportedMimeTypes = checker.getSupportedMimeTypes();

    // Find current device
    let currentDevice: MediaDeviceInfo | null = null;
    if (this.options.deviceId) {
      currentDevice =
        availableDevices.find((d) => d.deviceId === this.options.deviceId) ||
        null;
    }

    return {
      browserInfo: {
        name: browserInfo.name,
        version: browserInfo.version,
        platform: browserInfo.platform,
      },
      apiSupport: {
        getUserMedia: checker.checkFeature("getUserMedia"),
        mediaRecorder: checker.checkFeature("mediaRecorder"),
        audioContext: checker.checkFeature("audioContext"),
      },
      permissionState,
      availableDevices,
      currentDevice,
      supportedMimeTypes,
    };
  }

  /**
   * Reset recording state (for error recovery)
   */
  async resetState(): Promise<void> {
    await this.cleanup();
    this.recordedChunks = [];
    this.startTime = 0;
    this.pausedDuration = 0;
    this.lastPauseTime = 0;
  }

  /**
   * Retry an operation with exponential backoff
   */
  async retryOperation(
    operation: () => Promise<void>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await operation();
        return; // Success
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error("Operation failed");

        // Don't retry on permission errors
        if (error instanceof RecordingPermissionError) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Operation failed after retries");
  }
}

// Export singleton instance
export const recordingManager = new RecordingManager();
