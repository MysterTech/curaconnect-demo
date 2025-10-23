import { TranscriptSegment } from '../models/types';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: SpeechGrammarList;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export interface TranscriptionConfig {
  apiKey?: string;
  apiEndpoint?: string;
  language?: string;
  model?: string;
  enableSpeakerDiarization?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  chunkSize?: number;
  realTimeEnabled?: boolean;
}

export interface TranscriptionResult {
  segments: TranscriptSegment[];
  confidence: number;
  processingTime: number;
  language?: string;
  error?: string;
}

export interface TranscriptionServiceInterface {
  initialize(config: TranscriptionConfig): Promise<void>;
  transcribe(audioData: Blob | ArrayBuffer): Promise<TranscriptionResult>;
  startRealtimeTranscription(onSegment: (segment: TranscriptSegment) => void): Promise<void>;
  stopRealtimeTranscription(): Promise<void>;
  identifySpeaker(segment: TranscriptSegment, context: TranscriptSegment[]): 'provider' | 'patient' | 'unknown';
  isSupported(): boolean;
  getConfig(): TranscriptionConfig;
  updateConfig(config: Partial<TranscriptionConfig>): void;
}

export abstract class BaseTranscriptionService implements TranscriptionServiceInterface {
  protected config: TranscriptionConfig = {
    language: 'en-US',
    enableSpeakerDiarization: true,
    maxRetries: 3,
    retryDelay: 1000,
    chunkSize: 1024 * 1024, // 1MB
    realTimeEnabled: false
  };

  protected isInitialized = false;
  protected isRealtimeActive = false;
  protected realtimeCallback: ((segment: TranscriptSegment) => void) | null = null;

  constructor(config?: TranscriptionConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async initialize(config: TranscriptionConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.doInitialize();
    this.isInitialized = true;
  }

  abstract transcribe(audioData: Blob | ArrayBuffer): Promise<TranscriptionResult>;
  abstract startRealtimeTranscription(onSegment: (segment: TranscriptSegment) => void): Promise<void>;
  abstract stopRealtimeTranscription(): Promise<void>;
  abstract isSupported(): boolean;
  
  protected abstract doInitialize(): Promise<void>;

  getConfig(): TranscriptionConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<TranscriptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Identify speaker based on context and patterns
   */
  identifySpeaker(segment: TranscriptSegment, context: TranscriptSegment[]): 'provider' | 'patient' | 'unknown' {
    // Simple heuristic-based speaker identification
    const text = segment.text.toLowerCase();
    
    // Provider indicators
    const providerPatterns = [
      /how are you/,
      /what brings you/,
      /let me examine/,
      /i recommend/,
      /take this medication/,
      /follow up/,
      /prescription/,
      /diagnosis/,
      /treatment/
    ];

    // Patient indicators  
    const patientPatterns = [
      /i feel/,
      /i have been/,
      /my pain/,
      /it hurts/,
      /i'm experiencing/,
      /since last week/,
      /the medication/,
      /i can't/,
      /i've been taking/
    ];

    // Check patterns
    for (const pattern of providerPatterns) {
      if (pattern.test(text)) {
        return 'provider';
      }
    }

    for (const pattern of patientPatterns) {
      if (pattern.test(text)) {
        return 'patient';
      }
    }

    // Use context to determine speaker
    if (context.length > 0) {
      const lastSpeaker = context[context.length - 1].speaker;
      
      // Simple alternating pattern assumption
      if (lastSpeaker === 'provider') {
        return 'patient';
      } else if (lastSpeaker === 'patient') {
        return 'provider';
      }
    }

    // Default to unknown if no clear indication
    return 'unknown';
  }

  /**
   * Generate unique segment ID
   */
  protected generateSegmentId(): string {
    return `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retry logic for API calls
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3,
    delay: number = this.config.retryDelay || 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  /**
   * Convert audio blob to appropriate format
   */
  protected async prepareAudioData(audioData: Blob | ArrayBuffer): Promise<ArrayBuffer> {
    if (audioData instanceof ArrayBuffer) {
      return audioData;
    }

    return await audioData.arrayBuffer();
  }

  /**
   * Validate audio data
   */
  protected validateAudioData(audioData: Blob | ArrayBuffer): void {
    if (!audioData) {
      throw new Error('Audio data is required');
    }

    const size = audioData instanceof Blob ? audioData.size : audioData.byteLength;
    if (size === 0) {
      throw new Error('Audio data is empty');
    }

    const maxSize = this.config.chunkSize || 1024 * 1024;
    if (size > maxSize) {
      throw new Error(`Audio data too large: ${size} bytes (max: ${maxSize} bytes)`);
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.isRealtimeActive) {
      await this.stopRealtimeTranscription();
    }
    this.isInitialized = false;
    this.realtimeCallback = null;
  }
}

/**
 * Web Speech API implementation
 */
export class WebSpeechTranscriptionService extends BaseTranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private currentSegments: TranscriptSegment[] = [];

  protected async doInitialize(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Web Speech API not supported in this browser");
    }

    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.language || "en-US";
  }

  async transcribe(
    _audioData: Blob | ArrayBuffer
  ): Promise<TranscriptionResult> {
    throw new Error(
      "Web Speech API does not support file transcription. Use real-time transcription instead."
    );
  }

  async startRealtimeTranscription(
    onSegment: (segment: TranscriptSegment) => void
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error("Transcription service not initialized");
    }

    if (this.isRealtimeActive) {
      throw new Error("Real-time transcription already active");
    }

    this.realtimeCallback = onSegment;
    this.currentSegments = [];
    this.isRealtimeActive = true;

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Recognition not available"));
        return;
      }

      this.recognition.onstart = () => {
        resolve();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.handleSpeechResult(event);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        this.isRealtimeActive = false;
      };

      this.recognition.onend = () => {
        this.isRealtimeActive = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isRealtimeActive = false;
        reject(error);
      }
    });
  }

  async stopRealtimeTranscription(): Promise<void> {
    if (this.recognition && this.isRealtimeActive) {
      this.recognition.stop();
      this.isRealtimeActive = false;
      this.realtimeCallback = null;
    }
  }

  isSupported(): boolean {
    return !!(
      window.SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    if (!this.realtimeCallback) return;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0.5;

      if (result.isFinal) {
        const segment: TranscriptSegment = {
          id: this.generateSegmentId(),
          timestamp: Date.now() / 1000,
          speaker: this.identifySpeaker(
            {
              id: "",
              timestamp: 0,
              speaker: "unknown",
              text: transcript,
            },
            this.currentSegments
          ),
          text: transcript.trim(),
          confidence,
        };

        this.currentSegments.push(segment);
        this.realtimeCallback(segment);
      }
    }
  }
}

/**
 * Mock transcription service for testing
 */
export class MockTranscriptionService extends BaseTranscriptionService {
  private mockDelay = 1000;

  protected async doInitialize(): Promise<void> {
    // Mock initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async transcribe(audioData: Blob | ArrayBuffer): Promise<TranscriptionResult> {
    this.validateAudioData(audioData);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));

    const mockSegments: TranscriptSegment[] = [
      {
        id: this.generateSegmentId(),
        timestamp: 0,
        speaker: 'provider',
        text: 'How are you feeling today?',
        confidence: 0.95
      },
      {
        id: this.generateSegmentId(),
        timestamp: 3,
        speaker: 'patient',
        text: 'I have been experiencing some chest pain.',
        confidence: 0.92
      }
    ];

    return {
      segments: mockSegments,
      confidence: 0.93,
      processingTime: this.mockDelay,
      language: this.config.language
    };
  }

  async startRealtimeTranscription(onSegment: (segment: TranscriptSegment) => void): Promise<void> {
    if (this.isRealtimeActive) {
      throw new Error('Real-time transcription already active');
    }

    this.isRealtimeActive = true;
    this.realtimeCallback = onSegment;

    // Simulate real-time segments
    const mockSegments = [
      { text: 'Hello, how can I help you today?', speaker: 'provider' as const, delay: 1000 },
      { text: 'I have been having headaches.', speaker: 'patient' as const, delay: 3000 },
      { text: 'When did these headaches start?', speaker: 'provider' as const, delay: 2000 },
      { text: 'About a week ago.', speaker: 'patient' as const, delay: 2500 }
    ];

    let currentTime = 0;
    for (const mock of mockSegments) {
      if (!this.isRealtimeActive) break;

      await new Promise(resolve => setTimeout(resolve, mock.delay));
      
      if (this.realtimeCallback && this.isRealtimeActive) {
        const segment: TranscriptSegment = {
          id: this.generateSegmentId(),
          timestamp: currentTime,
          speaker: mock.speaker,
          text: mock.text,
          confidence: 0.9 + Math.random() * 0.1
        };

        this.realtimeCallback(segment);
        currentTime += mock.delay / 1000;
      }
    }
  }

  async stopRealtimeTranscription(): Promise<void> {
    this.isRealtimeActive = false;
    this.realtimeCallback = null;
  }

  isSupported(): boolean {
    return true;
  }

  setMockDelay(delay: number): void {
    this.mockDelay = delay;
  }
}