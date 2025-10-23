import { 
  TranscriptionServiceInterface, 
  TranscriptionResult, 
  WebSpeechTranscriptionService,
  MockTranscriptionService
} from './TranscriptionService';
import { WhisperTranscriptionService } from './WhisperTranscriptionService';
import type { WhisperConfig } from './WhisperTranscriptionService';
import { GeminiTranscriptionService } from './GeminiTranscriptionService';
import { SpeakerDiarizationService } from './SpeakerDiarizationService';
import { TranscriptSegment } from '../models/types';

export interface ServicePriority {
  service: TranscriptionServiceInterface;
  priority: number;
  name: string;
  isAvailable: boolean;
}

export interface FallbackConfig {
  enableFallback: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackOrder: string[];
  timeoutMs: number;
}

export interface TranscriptionError {
  code: string;
  message: string;
  service: string;
  timestamp: Date;
  recoverable: boolean;
}

export class TranscriptionServiceManager {
  private services: Map<string, TranscriptionServiceInterface> = new Map();
  private servicePriorities: ServicePriority[] = [];
  private diarizationService: SpeakerDiarizationService;
  private currentService: TranscriptionServiceInterface | null = null;
  private fallbackConfig: FallbackConfig = {
    enableFallback: true,
    maxRetries: 3,
    retryDelay: 1000,
    fallbackOrder: ['gemini', 'whisper', 'webspeech', 'mock'],
    timeoutMs: 30000
  };

  private errorHistory: TranscriptionError[] = [];
  private isRealtimeActive = false;
  private realtimeCallback: ((segment: TranscriptSegment) => void) | null = null;

  constructor(fallbackConfig?: Partial<FallbackConfig>) {
    if (fallbackConfig) {
      this.fallbackConfig = { ...this.fallbackConfig, ...fallbackConfig };
    }

    this.diarizationService = new SpeakerDiarizationService();
    this.initializeServices();
  }

  /**
   * Initialize available transcription services
   */
  private async initializeServices(): Promise<void> {
    // Initialize Gemini service if API key is configured
    const geminiService = new GeminiTranscriptionService();
    if (geminiService.isConfigured()) {
      this.services.set('gemini', geminiService);
      this.servicePriorities.push({
        service: geminiService,
        priority: 3,
        name: 'gemini',
        isAvailable: true
      });
    }

    // Initialize Web Speech API service
    const webSpeechService = new WebSpeechTranscriptionService();
    if (webSpeechService.isSupported()) {
      this.services.set('webspeech', webSpeechService);
      this.servicePriorities.push({
        service: webSpeechService,
        priority: 2,
        name: 'webspeech',
        isAvailable: true
      });
    }

    // Mock service (always available for testing)
    const mockService = new MockTranscriptionService();
    this.services.set('mock', mockService);
    this.servicePriorities.push({
      service: mockService,
      priority: 0,
      name: 'mock',
      isAvailable: true
    });

    // Sort by priority (higher priority first)
    this.servicePriorities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add Whisper service with API key
   */
  async addWhisperService(apiKey: string, config?: Partial<WhisperConfig>): Promise<void> {
    try {
      const whisperService = new WhisperTranscriptionService({ 
        apiKey, 
        ...config 
      });
      
      await whisperService.initialize({ apiKey, ...config });
      
      this.services.set('whisper', whisperService);
      
      // Remove existing whisper entry if any
      this.servicePriorities = this.servicePriorities.filter(sp => sp.name !== 'whisper');
      
      // Add with highest priority
      this.servicePriorities.unshift({
        service: whisperService,
        priority: 3,
        name: 'whisper',
        isAvailable: true
      });
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('Whisper initialization failed');
      this.logError('whisper', 'initialization', typedError, false);
      throw typedError;
    }
  }

  /**
   * Transcribe audio with automatic fallback
   */
  async transcribe(audioData: Blob | ArrayBuffer): Promise<TranscriptionResult> {
    const availableServices = this.getAvailableServices();
    
    if (availableServices.length === 0) {
      throw new Error('No transcription services available');
    }

    let lastError: Error | null = null;

    for (const serviceInfo of availableServices) {
      try {
        const result = await this.transcribeWithTimeout(serviceInfo.service, audioData);
        
        // Apply speaker diarization if segments don't have speaker info
        if (result.segments.some(s => s.speaker === 'unknown')) {
          result.segments = this.applySpeakerDiarization(result.segments);
        }

        // Mark service as working
        serviceInfo.isAvailable = true;
        this.currentService = serviceInfo.service;
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.logError(serviceInfo.name, 'transcription', lastError, true);
        
        // Mark service as temporarily unavailable
        serviceInfo.isAvailable = false;
        
        // If this was a timeout or network error, try next service
        if (this.isRecoverableError(lastError)) {
          continue;
        }
        
        // For non-recoverable errors, stop trying
        break;
      }
    }

    throw lastError || new Error('All transcription services failed');
  }

  /**
   * Start real-time transcription with fallback
   */
  async startRealtimeTranscription(onSegment: (segment: TranscriptSegment) => void): Promise<void> {
    if (this.isRealtimeActive) {
      throw new Error('Real-time transcription already active');
    }

    // Filter out batch-only services (Gemini and Whisper)
    const availableServices = this.getAvailableServices().filter(s => {
      // Gemini and Whisper are batch-only
      if (s.name === 'gemini' || s.name === 'whisper') {
        console.log(`⏭️ Skipping ${s.name} - batch-only service`);
        return false;
      }
      return s.service.getConfig().realTimeEnabled !== false;
    });

    console.log(`🔍 Available real-time services: ${availableServices.map(s => s.name).join(', ')}`);

    if (availableServices.length === 0) {
      console.warn('⚠️ No real-time transcription services available. Will use batch transcription on stop.');
      throw new Error('No real-time transcription services available');
    }

    this.realtimeCallback = (segment: TranscriptSegment) => {
      // Apply speaker diarization
      const segments = this.applySpeakerDiarization([segment]);
      onSegment(segments[0]);
    };

    let lastError: Error | null = null;

    for (const serviceInfo of availableServices) {
      try {
        console.log(`🎤 Attempting to start real-time transcription with ${serviceInfo.name}...`);
        await serviceInfo.service.startRealtimeTranscription(this.realtimeCallback);
        this.isRealtimeActive = true;
        this.currentService = serviceInfo.service;
        console.log(`✅ Real-time transcription started with ${serviceInfo.name}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`❌ ${serviceInfo.name} real-time transcription failed:`, error);
        this.logError(serviceInfo.name, 'realtime_start', lastError, true);
        serviceInfo.isAvailable = false;
      }
    }

    throw lastError || new Error('Failed to start real-time transcription');
  }

  /**
   * Stop real-time transcription
   */
  async stopRealtimeTranscription(): Promise<void> {
    if (!this.isRealtimeActive || !this.currentService) {
      return;
    }

    try {
      await this.currentService.stopRealtimeTranscription();
    } catch (error) {
      console.warn('Error stopping real-time transcription:', error);
    } finally {
      this.isRealtimeActive = false;
      this.realtimeCallback = null;
    }
  }

  /**
   * Transcribe with timeout
   */
  private async transcribeWithTimeout(
    service: TranscriptionServiceInterface, 
    audioData: Blob | ArrayBuffer
  ): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Transcription timeout after ${this.fallbackConfig.timeoutMs}ms`));
      }, this.fallbackConfig.timeoutMs);

      service.transcribe(audioData)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          const typedError = error instanceof Error ? error : new Error('Transcription failed');
          clearTimeout(timeout);
          reject(typedError);
        });
    });
  }

  /**
   * Apply speaker diarization to segments
   */
  private applySpeakerDiarization(segments: TranscriptSegment[]): TranscriptSegment[] {
    return this.diarizationService.processBatch(segments);
  }

  /**
   * Get available services in priority order
   */
  private getAvailableServices(): ServicePriority[] {
    return this.servicePriorities
      .filter(sp => sp.isAvailable)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /rate limit/i,
      /quota/i,
      /temporary/i,
      /503/,
      /502/,
      /504/
    ];

    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Log transcription error
   */
  private logError(service: string, operation: string, error: Error, recoverable: boolean): void {
    const transcriptionError: TranscriptionError = {
      code: error.name || 'UnknownError',
      message: error.message,
      service,
      timestamp: new Date(),
      recoverable
    };

    this.errorHistory.push(transcriptionError);
    
    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    console.error(`Transcription error in ${service} (${operation}):`, error);
  }

  /**
   * Get error history
   */
  getErrorHistory(): TranscriptionError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get service status
   */
  getServiceStatus(): { name: string; available: boolean; priority: number }[] {
    return this.servicePriorities.map(sp => ({
      name: sp.name,
      available: sp.isAvailable,
      priority: sp.priority
    }));
  }

  /**
   * Reset service availability
   */
  resetServiceAvailability(): void {
    this.servicePriorities.forEach(sp => {
      sp.isAvailable = sp.service.isSupported();
    });
  }

  /**
   * Update fallback configuration
   */
  updateFallbackConfig(config: Partial<FallbackConfig>): void {
    this.fallbackConfig = { ...this.fallbackConfig, ...config };
  }

  /**
   * Get current service name
   */
  getCurrentServiceName(): string | null {
    if (!this.currentService) return null;
    
    for (const [name, service] of this.services.entries()) {
      if (service === this.currentService) {
        return name;
      }
    }
    
    return null;
  }

  /**
   * Force use of specific service
   */
  async useService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    if (!service.isSupported()) {
      throw new Error(`Service '${serviceName}' is not supported`);
    }

    this.currentService = service;
    
    // Update priority to make this service preferred
    const serviceInfo = this.servicePriorities.find(sp => sp.name === serviceName);
    if (serviceInfo) {
      serviceInfo.isAvailable = true;
      serviceInfo.priority = Math.max(...this.servicePriorities.map(sp => sp.priority)) + 1;
    }
  }

  /**
   * Test all services
   */
  async testServices(): Promise<{ [serviceName: string]: boolean }> {
    const results: { [serviceName: string]: boolean } = {};
    
    // Create small test audio blob
    const testAudio = new Blob(['test'], { type: 'audio/webm' });
    
    for (const [name, service] of this.services.entries()) {
      try {
        if (name === 'webspeech') {
          // Web Speech API can't transcribe blobs, just check if supported
          results[name] = service.isSupported();
        } else {
          await service.transcribe(testAudio);
          results[name] = true;
        }
      } catch (error) {
        results[name] = false;
        this.logError(name, 'test', error instanceof Error ? error : new Error('Test failed'), true);
      }
    }
    
    return results;
  }

  /**
   * Get transcription statistics
   */
  getStatistics(): {
    totalErrors: number;
    errorsByService: { [service: string]: number };
    recoverableErrors: number;
    currentService: string | null;
    availableServices: number;
  } {
    const errorsByService: { [service: string]: number } = {};
    let recoverableErrors = 0;

    this.errorHistory.forEach(error => {
      errorsByService[error.service] = (errorsByService[error.service] || 0) + 1;
      if (error.recoverable) {
        recoverableErrors++;
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByService,
      recoverableErrors,
      currentService: this.getCurrentServiceName(),
      availableServices: this.getAvailableServices().length
    };
  }

  /**
   * Dispose of all services
   */
  async dispose(): Promise<void> {
    if (this.isRealtimeActive) {
      await this.stopRealtimeTranscription();
    }

    for (const service of this.services.values()) {
      try {
        await service.dispose();
      } catch (error) {
        console.warn('Error disposing service:', error);
      }
    }

    this.services.clear();
    this.servicePriorities = [];
    this.currentService = null;
    this.errorHistory = [];
  }
}
