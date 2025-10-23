export interface AudioVisualizationData {
  audioLevel: number;
  frequencyData: Float32Array;
  waveformData: Float32Array;
  peak: number;
  rms: number;
  isClipping: boolean;
}

export interface VisualizationOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  updateInterval?: number;
}

export class AudioVisualizationService {
  private analyserNode: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private isActive = false;

  // Visualization data
  private currentData: AudioVisualizationData = {
    audioLevel: 0,
    frequencyData: new Float32Array(0),
    waveformData: new Float32Array(0),
    peak: 0,
    rms: 0,
    isClipping: false
  };

  // Configuration
  private options: Required<VisualizationOptions> = {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    updateInterval: 16 // ~60fps
  };

  // Callbacks
  private dataCallbacks: ((data: AudioVisualizationData) => void)[] = [];
  private lastUpdateTime = 0;

  constructor(options?: VisualizationOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Initialize visualization with media stream
   */
  async initialize(mediaStream: MediaStream): Promise<void> {
    try {
      if (this.isActive) {
        await this.stop();
      }

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create source from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream);

      // Create and configure analyser
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.options.fftSize;
      this.analyserNode.smoothingTimeConstant = this.options.smoothingTimeConstant;
      this.analyserNode.minDecibels = this.options.minDecibels;
      this.analyserNode.maxDecibels = this.options.maxDecibels;

      // Connect nodes
      this.sourceNode.connect(this.analyserNode);

      // Initialize data arrays
      const bufferLength = this.analyserNode.frequencyBinCount;
      this.currentData = {
        audioLevel: 0,
        frequencyData: new Float32Array(bufferLength),
        waveformData: new Float32Array(bufferLength),
        peak: 0,
        rms: 0,
        isClipping: false
      };

      this.isActive = true;
      this.startVisualization();
    } catch (error) {
      await this.cleanup();
      throw new Error(`Failed to initialize audio visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start visualization updates
   */
  start(): void {
    if (!this.isActive || !this.analyserNode) {
      throw new Error('Visualization not initialized');
    }

    this.startVisualization();
  }

  /**
   * Stop visualization updates
   */
  async stop(): Promise<void> {
    this.stopVisualization();
    await this.cleanup();
  }

  /**
   * Get current visualization data
   */
  getCurrentData(): AudioVisualizationData {
    return {
      audioLevel: this.currentData.audioLevel,
      frequencyData: new Float32Array(this.currentData.frequencyData),
      waveformData: new Float32Array(this.currentData.waveformData),
      peak: this.currentData.peak,
      rms: this.currentData.rms,
      isClipping: this.currentData.isClipping
    };
  }

  /**
   * Register callback for visualization data updates
   */
  onDataUpdate(callback: (data: AudioVisualizationData) => void): void {
    this.dataCallbacks.push(callback);
  }

  /**
   * Remove data update callback
   */
  removeDataCallback(callback: (data: AudioVisualizationData) => void): void {
    const index = this.dataCallbacks.indexOf(callback);
    if (index > -1) {
      this.dataCallbacks.splice(index, 1);
    }
  }

  /**
   * Update visualization options
   */
  updateOptions(options: Partial<VisualizationOptions>): void {
    this.options = { ...this.options, ...options };

    if (this.analyserNode) {
      if (options.fftSize !== undefined) {
        this.analyserNode.fftSize = options.fftSize;
        // Reinitialize data arrays with new size
        const bufferLength = this.analyserNode.frequencyBinCount;
        this.currentData.frequencyData = new Float32Array(bufferLength);
        this.currentData.waveformData = new Float32Array(bufferLength);
      }

      if (options.smoothingTimeConstant !== undefined) {
        this.analyserNode.smoothingTimeConstant = options.smoothingTimeConstant;
      }

      if (options.minDecibels !== undefined) {
        this.analyserNode.minDecibels = options.minDecibels;
      }

      if (options.maxDecibels !== undefined) {
        this.analyserNode.maxDecibels = options.maxDecibels;
      }
    }
  }

  /**
   * Get frequency data for specific frequency range
   */
  getFrequencyRange(minFreq: number, maxFreq: number): Float32Array {
    if (!this.analyserNode || !this.audioContext) {
      return new Float32Array(0);
    }

    const sampleRate = this.audioContext.sampleRate;
    const bufferLength = this.analyserNode.frequencyBinCount;
    const frequencyStep = sampleRate / (2 * bufferLength);

    const minIndex = Math.floor(minFreq / frequencyStep);
    const maxIndex = Math.ceil(maxFreq / frequencyStep);

    const startIndex = Math.max(0, minIndex);
    const endIndex = Math.min(bufferLength, maxIndex);

    return this.currentData.frequencyData.slice(startIndex, endIndex);
  }

  /**
   * Calculate audio level in decibels
   */
  getAudioLevelDB(): number {
    if (this.currentData.rms === 0) return -Infinity;
    return 20 * Math.log10(this.currentData.rms);
  }

  /**
   * Check if audio is currently clipping
   */
  isClipping(): boolean {
    return this.currentData.isClipping;
  }

  /**
   * Get peak frequency (frequency with highest amplitude)
   */
  getPeakFrequency(): number {
    if (!this.analyserNode || !this.audioContext) {
      return 0;
    }

    let maxIndex = 0;
    let maxValue = -Infinity;

    for (let i = 0; i < this.currentData.frequencyData.length; i++) {
      if (this.currentData.frequencyData[i] > maxValue) {
        maxValue = this.currentData.frequencyData[i];
        maxIndex = i;
      }
    }

    const sampleRate = this.audioContext.sampleRate;
    const bufferLength = this.analyserNode.frequencyBinCount;
    const frequencyStep = sampleRate / (2 * bufferLength);

    return maxIndex * frequencyStep;
  }

  /**
   * Start the visualization update loop
   */
  private startVisualization(): void {
    if (!this.analyserNode) return;

    const updateVisualization = (currentTime: number) => {
      if (!this.isActive || !this.analyserNode) return;

      // Throttle updates based on updateInterval
      if (currentTime - this.lastUpdateTime >= this.options.updateInterval) {
        this.updateVisualizationData();
        this.notifyDataCallbacks();
        this.lastUpdateTime = currentTime;
      }

      this.animationFrameId = requestAnimationFrame(updateVisualization);
    };

    this.animationFrameId = requestAnimationFrame(updateVisualization);
  }

  /**
   * Stop the visualization update loop
   */
  private stopVisualization(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isActive = false;
  }

  /**
   * Update visualization data from analyser
   */
  private updateVisualizationData(): void {
    if (!this.analyserNode) return;

    // Get frequency data
    const frequencyBuffer = new Float32Array(this.currentData.frequencyData.length);
    this.analyserNode.getFloatFrequencyData(frequencyBuffer);
    this.currentData.frequencyData.set(frequencyBuffer);

    // Get time domain data (waveform)
    const waveformBuffer = new Float32Array(this.currentData.waveformData.length);
    this.analyserNode.getFloatTimeDomainData(waveformBuffer);
    this.currentData.waveformData.set(waveformBuffer);

    // Calculate audio metrics
    this.calculateAudioMetrics();
  }

  /**
   * Calculate audio level, peak, RMS, and clipping detection
   */
  private calculateAudioMetrics(): void {
    const waveformData = this.currentData.waveformData;
    let sum = 0;
    let peak = 0;
    let isClipping = false;

    // Calculate RMS and peak from waveform data
    for (let i = 0; i < waveformData.length; i++) {
      const sample = Math.abs(waveformData[i]);
      sum += sample * sample;
      
      if (sample > peak) {
        peak = sample;
      }

      // Check for clipping (values near 1.0 or -1.0)
      if (sample > 0.95) {
        isClipping = true;
      }
    }

    // Calculate RMS (Root Mean Square)
    const rms = Math.sqrt(sum / waveformData.length);

    // Update current data
    this.currentData.rms = rms;
    this.currentData.peak = peak;
    this.currentData.audioLevel = rms; // Normalized audio level
    this.currentData.isClipping = isClipping;
  }

  /**
   * Notify all data callbacks
   */
  private notifyDataCallbacks(): void {
    const data = this.getCurrentData();
    
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in visualization data callback:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
    this.stopVisualization();

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.isActive = false;
  }

  /**
   * Dispose of the service and clean up all resources
   */
  async dispose(): Promise<void> {
    await this.cleanup();
    this.dataCallbacks = [];
  }
}

// Utility functions for visualization processing

/**
 * Apply smoothing to visualization data
 */
export function smoothData(
  currentData: Float32Array, 
  previousData: Float32Array, 
  smoothingFactor: number = 0.8
): Float32Array {
  const smoothed = new Float32Array(currentData.length);
  
  for (let i = 0; i < currentData.length; i++) {
    smoothed[i] = (smoothingFactor * previousData[i]) + ((1 - smoothingFactor) * currentData[i]);
  }
  
  return smoothed;
}

/**
 * Normalize data to 0-1 range
 */
export function normalizeData(data: Float32Array, min: number = -90, max: number = -10): Float32Array {
  const normalized = new Float32Array(data.length);
  const range = max - min;
  
  for (let i = 0; i < data.length; i++) {
    normalized[i] = Math.max(0, Math.min(1, (data[i] - min) / range));
  }
  
  return normalized;
}

/**
 * Apply logarithmic scaling to frequency data
 */
export function applyLogScale(data: Float32Array, base: number = 10): Float32Array {
  const scaled = new Float32Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    scaled[i] = Math.log(Math.max(0.001, data[i])) / Math.log(base);
  }
  
  return scaled;
}

/**
 * Downsample data for performance
 */
export function downsampleData(data: Float32Array, targetLength: number): Float32Array {
  if (data.length <= targetLength) {
    return new Float32Array(data);
  }

  const downsampled = new Float32Array(targetLength);
  const step = data.length / targetLength;
  
  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    
    let sum = 0;
    let count = 0;
    
    for (let j = start; j < end && j < data.length; j++) {
      sum += data[j];
      count++;
    }
    
    downsampled[i] = count > 0 ? sum / count : 0;
  }
  
  return downsampled;
}
