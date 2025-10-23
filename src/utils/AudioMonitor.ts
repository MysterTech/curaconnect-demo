/**
 * Audio monitoring utility for detecting audio issues during recording
 */

export interface AudioMonitorConfig {
  noAudioThreshold: number; // Threshold below which audio is considered silent (0-1)
  noAudioDuration: number; // Duration in ms before warning about no audio
  lowAudioThreshold: number; // Threshold for low audio warning (0-1)
  clippingThreshold: number; // Threshold above which audio is considered clipping (0-1)
  checkInterval: number; // How often to check audio levels in ms
}

export interface AudioWarning {
  type: 'no_audio' | 'low_audio' | 'clipping';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
}

export class AudioMonitor {
  private config: AudioMonitorConfig;
  private audioLevelHistory: number[] = [];
  private lastAudioTime: number = Date.now();
  private warnings: AudioWarning[] = [];
  private warningCallbacks: ((warning: AudioWarning) => void)[] = [];
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<AudioMonitorConfig>) {
    this.config = {
      noAudioThreshold: 0.01,
      noAudioDuration: 5000, // 5 seconds
      lowAudioThreshold: 0.1,
      clippingThreshold: 0.95,
      checkInterval: 1000, // Check every second
      ...config
    };
  }

  /**
   * Start monitoring audio levels
   */
  start(): void {
    this.stop(); // Clear any existing interval
    this.lastAudioTime = Date.now();
    this.audioLevelHistory = [];
    this.warnings = [];

    this.checkIntervalId = setInterval(() => {
      this.checkAudioLevels();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  /**
   * Update with new audio level
   */
  updateAudioLevel(level: number): void {
    this.audioLevelHistory.push(level);
    
    // Keep only last 10 samples
    if (this.audioLevelHistory.length > 10) {
      this.audioLevelHistory.shift();
    }

    // Update last audio time if we detect audio
    if (level > this.config.noAudioThreshold) {
      this.lastAudioTime = Date.now();
    }
  }

  /**
   * Check audio levels and emit warnings
   */
  private checkAudioLevels(): void {
    if (this.audioLevelHistory.length === 0) return;

    const avgLevel = this.audioLevelHistory.reduce((a, b) => a + b, 0) / this.audioLevelHistory.length;
    const maxLevel = Math.max(...this.audioLevelHistory);
    const timeSinceAudio = Date.now() - this.lastAudioTime;

    // Check for no audio
    if (timeSinceAudio > this.config.noAudioDuration && avgLevel < this.config.noAudioThreshold) {
      this.emitWarning({
        type: 'no_audio',
        message: 'No audio detected. Please check your microphone.',
        severity: 'error',
        timestamp: new Date()
      });
    }
    // Check for low audio
    else if (avgLevel > this.config.noAudioThreshold && avgLevel < this.config.lowAudioThreshold) {
      this.emitWarning({
        type: 'low_audio',
        message: 'Audio level is low. Consider speaking louder or adjusting microphone settings.',
        severity: 'warning',
        timestamp: new Date()
      });
    }

    // Check for clipping
    if (maxLevel > this.config.clippingThreshold) {
      this.emitWarning({
        type: 'clipping',
        message: 'Audio level is too high and may be distorted. Consider speaking softer or adjusting microphone settings.',
        severity: 'warning',
        timestamp: new Date()
      });
    }
  }

  /**
   * Emit a warning
   */
  private emitWarning(warning: AudioWarning): void {
    // Don't emit duplicate warnings within 10 seconds
    const recentWarning = this.warnings.find(
      w => w.type === warning.type && 
      (Date.now() - w.timestamp.getTime()) < 10000
    );

    if (recentWarning) return;

    this.warnings.push(warning);
    this.warningCallbacks.forEach(callback => {
      try {
        callback(warning);
      } catch (error) {
        console.error('Error in audio warning callback:', error);
      }
    });
  }

  /**
   * Register callback for warnings
   */
  onWarning(callback: (warning: AudioWarning) => void): void {
    this.warningCallbacks.push(callback);
  }

  /**
   * Remove warning callback
   */
  removeWarningCallback(callback: (warning: AudioWarning) => void): void {
    const index = this.warningCallbacks.indexOf(callback);
    if (index > -1) {
      this.warningCallbacks.splice(index, 1);
    }
  }

  /**
   * Get recent warnings
   */
  getRecentWarnings(count: number = 5): AudioWarning[] {
    return this.warnings.slice(-count);
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Get audio quality assessment
   */
  getAudioQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'none' {
    if (this.audioLevelHistory.length === 0) return 'none';

    const avgLevel = this.audioLevelHistory.reduce((a, b) => a + b, 0) / this.audioLevelHistory.length;
    const timeSinceAudio = Date.now() - this.lastAudioTime;

    if (timeSinceAudio > this.config.noAudioDuration) {
      return 'none';
    }

    if (avgLevel < this.config.noAudioThreshold) {
      return 'poor';
    }

    if (avgLevel < this.config.lowAudioThreshold) {
      return 'fair';
    }

    const maxLevel = Math.max(...this.audioLevelHistory);
    if (maxLevel > this.config.clippingThreshold) {
      return 'fair';
    }

    if (avgLevel >= 0.3 && avgLevel <= 0.7) {
      return 'excellent';
    }

    return 'good';
  }

  /**
   * Dispose of the monitor
   */
  dispose(): void {
    this.stop();
    this.warningCallbacks = [];
    this.audioLevelHistory = [];
    this.warnings = [];
  }
}
