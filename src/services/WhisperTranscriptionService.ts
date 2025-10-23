import { BaseTranscriptionService, TranscriptionResult, TranscriptionConfig } from './TranscriptionService';
import { TranscriptSegment } from '../models/types';

export interface WhisperConfig extends TranscriptionConfig {
  apiKey: string;
  model?: 'whisper-1';
  temperature?: number;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  timestamp_granularities?: ('word' | 'segment')[];
}

export interface WhisperResponse {
  text: string;
  segments?: WhisperSegment[];
  words?: WhisperWord[];
  language?: string;
}

export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export class WhisperTranscriptionService extends BaseTranscriptionService {
  private whisperConfig: WhisperConfig;
  private baseUrl = 'https://api.openai.com/v1/audio';

  constructor(config: WhisperConfig) {
    super(config);
    this.whisperConfig = {
      model: 'whisper-1',
      temperature: 0,
      responseFormat: 'verbose_json',
      timestamp_granularities: ['segment'],
      ...config
    };
  }

  protected async doInitialize(): Promise<void> {
    if (!this.whisperConfig.apiKey) {
      throw new Error('OpenAI API key is required for Whisper transcription');
    }

    // Test API connection
    try {
      await this.testApiConnection();
    } catch (error) {
      throw new Error(`Failed to connect to OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribe(audioData: Blob | ArrayBuffer): Promise<TranscriptionResult> {
    this.validateAudioData(audioData);

    const startTime = Date.now();

    try {
      const response = await this.retryOperation(async () => {
        return await this.callWhisperAPI(audioData);
      });

      const segments = this.convertWhisperSegments(response.segments || []);
      const processingTime = Date.now() - startTime;

      return {
        segments,
        confidence: this.calculateOverallConfidence(response.segments || []),
        processingTime,
        language: response.language
      };
    } catch (error) {
      throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async startRealtimeTranscription(onSegment: (segment: TranscriptSegment) => void): Promise<void> {
    // Whisper API doesn't support real-time streaming
    // This implementation uses chunked audio processing
    
    if (this.isRealtimeActive) {
      throw new Error('Real-time transcription already active');
    }

    this.isRealtimeActive = true;
    this.realtimeCallback = onSegment;

    // Note: This is a simplified implementation
    // Real implementation would need audio chunking and streaming
    throw new Error('Real-time transcription not yet implemented for Whisper API. Use file-based transcription.');
  }

  async stopRealtimeTranscription(): Promise<void> {
    this.isRealtimeActive = false;
    this.realtimeCallback = null;
  }

  isSupported(): boolean {
    return !!(this.whisperConfig.apiKey && typeof fetch !== 'undefined');
  }

  /**
   * Call OpenAI Whisper API
   */
  private async callWhisperAPI(audioData: Blob | ArrayBuffer): Promise<WhisperResponse> {
    const formData = new FormData();
    
    // Convert ArrayBuffer to Blob if needed
    const audioBlob = audioData instanceof Blob 
      ? audioData 
      : new Blob([audioData], { type: 'audio/webm' });

    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', this.whisperConfig.model || 'whisper-1');
    formData.append('response_format', this.whisperConfig.responseFormat || 'verbose_json');
    
    if (this.whisperConfig.language) {
      formData.append('language', this.whisperConfig.language);
    }
    
    if (this.whisperConfig.prompt) {
      formData.append('prompt', this.whisperConfig.prompt);
    }
    
    if (this.whisperConfig.temperature !== undefined) {
      formData.append('temperature', this.whisperConfig.temperature.toString());
    }

    if (this.whisperConfig.timestamp_granularities) {
      this.whisperConfig.timestamp_granularities.forEach(granularity => {
        formData.append('timestamp_granularities[]', granularity);
      });
    }

    const response = await fetch(`${this.baseUrl}/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.whisperConfig.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
    }

    return await response.json();
  }

  /**
   * Test API connection
   */
  private async testApiConnection(): Promise<void> {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${this.whisperConfig.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`API connection test failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Convert Whisper segments to our format
   */
  private convertWhisperSegments(whisperSegments: WhisperSegment[]): TranscriptSegment[] {
    return whisperSegments.map((segment, index) => {
      const transcriptSegment: TranscriptSegment = {
        id: this.generateSegmentId(),
        timestamp: segment.start,
        speaker: 'unknown', // Whisper doesn't provide speaker identification
        text: segment.text.trim(),
        confidence: this.calculateSegmentConfidence(segment)
      };

      // Apply speaker identification if enabled
      if (this.config.enableSpeakerDiarization && index > 0) {
        const previousSegments = whisperSegments.slice(0, index).map(s => ({
          id: '',
          timestamp: s.start,
          speaker: 'unknown' as const,
          text: s.text,
          confidence: this.calculateSegmentConfidence(s)
        }));
        
        transcriptSegment.speaker = this.identifySpeaker(transcriptSegment, previousSegments);
      }

      return transcriptSegment;
    });
  }

  /**
   * Calculate confidence score from Whisper segment data
   */
  private calculateSegmentConfidence(segment: WhisperSegment): number {
    // Whisper provides avg_logprob and no_speech_prob
    // Convert to a 0-1 confidence score
    
    const logProbConfidence = Math.exp(segment.avg_logprob);
    const speechConfidence = 1 - segment.no_speech_prob;
    
    // Combine both metrics
    const confidence = (logProbConfidence + speechConfidence) / 2;
    
    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate overall confidence from all segments
   */
  private calculateOverallConfidence(segments: WhisperSegment[]): number {
    if (segments.length === 0) return 0;

    const totalConfidence = segments.reduce((sum, segment) => {
      return sum + this.calculateSegmentConfidence(segment);
    }, 0);

    return totalConfidence / segments.length;
  }

  /**
   * Update Whisper-specific configuration
   */
  updateWhisperConfig(config: Partial<WhisperConfig>): void {
    this.whisperConfig = { ...this.whisperConfig, ...config };
    this.updateConfig(config);
  }

  /**
   * Get Whisper-specific configuration
   */
  getWhisperConfig(): WhisperConfig {
    return { ...this.whisperConfig };
  }

  /**
   * Transcribe with custom prompt for better accuracy
   */
  async transcribeWithPrompt(audioData: Blob | ArrayBuffer, prompt: string): Promise<TranscriptionResult> {
    const originalPrompt = this.whisperConfig.prompt;
    this.whisperConfig.prompt = prompt;
    
    try {
      return await this.transcribe(audioData);
    } finally {
      this.whisperConfig.prompt = originalPrompt;
    }
  }

  /**
   * Transcribe with specific language
   */
  async transcribeWithLanguage(audioData: Blob | ArrayBuffer, language: string): Promise<TranscriptionResult> {
    const originalLanguage = this.whisperConfig.language;
    this.whisperConfig.language = language;
    
    try {
      return await this.transcribe(audioData);
    } finally {
      this.whisperConfig.language = originalLanguage;
    }
  }

  /**
   * Get supported languages for Whisper
   */
  getSupportedLanguages(): string[] {
    return [
      'af', 'am', 'ar', 'as', 'az', 'ba', 'be', 'bg', 'bn', 'bo', 'br', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr', 'gl', 'gu', 'ha', 'haw', 'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'id', 'is', 'it', 'ja', 'jw', 'ka', 'kk', 'km', 'kn', 'ko', 'la', 'lb', 'ln', 'lo', 'lt', 'lv', 'mg', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'ne', 'nl', 'nn', 'no', 'oc', 'pa', 'pl', 'ps', 'pt', 'ro', 'ru', 'sa', 'sd', 'si', 'sk', 'sl', 'sn', 'so', 'sq', 'sr', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'tk', 'tl', 'tr', 'tt', 'uk', 'ur', 'uz', 'vi', 'yi', 'yo', 'zh'
    ];
  }

  /**
   * Estimate transcription cost (approximate)
   */
  estimateCost(audioData: Blob | ArrayBuffer): number {
    const sizeInMB = (audioData instanceof Blob ? audioData.size : audioData.byteLength) / (1024 * 1024);
    // OpenAI Whisper pricing is approximately $0.006 per minute
    // Assuming average audio is about 1MB per minute
    return sizeInMB * 0.006;
  }

  /**
   * Check if audio format is supported
   */
  isSupportedFormat(mimeType: string): boolean {
    const supportedFormats = [
      'audio/mp3',
      'audio/mp4',
      'audio/mpeg',
      'audio/mpga',
      'audio/m4a',
      'audio/wav',
      'audio/webm'
    ];
    
    return supportedFormats.some(format => mimeType.includes(format));
  }

  /**
   * Convert audio to supported format if needed
   */
  async convertAudioFormat(audioData: Blob): Promise<Blob> {
    if (this.isSupportedFormat(audioData.type)) {
      return audioData;
    }

    // For unsupported formats, we'd need audio conversion
    // This is a placeholder - real implementation would use Web Audio API or a library
    console.warn(`Audio format ${audioData.type} may not be supported by Whisper API`);
    return audioData;
  }
}