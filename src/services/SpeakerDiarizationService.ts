import { TranscriptSegment } from '../models/types';

export interface SpeakerPattern {
  keywords: string[];
  phrases: RegExp[];
  weight: number;
}

export interface SpeakerContext {
  recentSegments: TranscriptSegment[];
  conversationFlow: 'provider-led' | 'patient-led' | 'balanced';
  dominantSpeaker: 'provider' | 'patient' | 'unknown';
}

export interface DiarizationConfig {
  enablePatternMatching: boolean;
  enableContextAnalysis: boolean;
  enableTemporalAnalysis: boolean;
  confidenceThreshold: number;
  contextWindowSize: number;
  alternationBias: number;
}

export class SpeakerDiarizationService {
  private config: DiarizationConfig = {
    enablePatternMatching: true,
    enableContextAnalysis: true,
    enableTemporalAnalysis: true,
    confidenceThreshold: 0.6,
    contextWindowSize: 5,
    alternationBias: 0.3
  };

  private providerPatterns: SpeakerPattern[] = [
    {
      keywords: ['examine', 'diagnosis', 'prescription', 'recommend', 'treatment', 'medication', 'follow-up'],
      phrases: [
        /how are you feeling/i,
        /what brings you/i,
        /let me (examine|check|look)/i,
        /i (recommend|suggest|prescribe)/i,
        /take this medication/i,
        /follow up (in|with)/i,
        /your (diagnosis|condition|treatment)/i,
        /we need to/i,
        /i'm going to/i,
        /based on your/i
      ],
      weight: 0.8
    },
    {
      keywords: ['blood pressure', 'heart rate', 'temperature', 'pulse', 'breathing'],
      phrases: [
        /your (blood pressure|heart rate|temperature)/i,
        /let's check your/i,
        /i can hear/i,
        /sounds (good|normal|concerning)/i
      ],
      weight: 0.7
    },
    {
      keywords: ['appointment', 'schedule', 'next visit', 'come back'],
      phrases: [
        /schedule (a|an|your)/i,
        /come back (in|next)/i,
        /see you (in|next)/i,
        /make an appointment/i
      ],
      weight: 0.6
    }
  ];

  private patientPatterns: SpeakerPattern[] = [
    {
      keywords: ['pain', 'hurt', 'feel', 'experiencing', 'symptoms', 'problem'],
      phrases: [
        /i (feel|have|am)/i,
        /my (pain|head|chest|back|stomach)/i,
        /it hurts/i,
        /i'm experiencing/i,
        /i can't/i,
        /i've been/i,
        /since (last|yesterday|this)/i
      ],
      weight: 0.8
    },
    {
      keywords: ['medication', 'pills', 'taking', 'prescribed'],
      phrases: [
        /i'm taking/i,
        /the medication/i,
        /my pills/i,
        /you prescribed/i,
        /i forgot to take/i
      ],
      weight: 0.7
    },
    {
      keywords: ['better', 'worse', 'same', 'improved'],
      phrases: [
        /feeling (better|worse|the same)/i,
        /it's (getting|been)/i,
        /much (better|worse)/i,
        /no (change|improvement)/i
      ],
      weight: 0.6
    }
  ];

  constructor(config?: Partial<DiarizationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Identify speaker for a transcript segment
   */
  identifySpeaker(
    segment: TranscriptSegment, 
    context: TranscriptSegment[] = []
  ): 'provider' | 'patient' | 'unknown' {
    const scores = {
      provider: 0,
      patient: 0
    };

    // Pattern matching analysis
    if (this.config.enablePatternMatching) {
      const patternScores = this.analyzePatterns(segment.text);
      scores.provider += patternScores.provider * 0.4;
      scores.patient += patternScores.patient * 0.4;
    }

    // Context analysis
    if (this.config.enableContextAnalysis && context.length > 0) {
      const contextScores = this.analyzeContext(segment, context);
      scores.provider += contextScores.provider * 0.3;
      scores.patient += contextScores.patient * 0.3;
    }

    // Temporal analysis (conversation flow)
    if (this.config.enableTemporalAnalysis && context.length > 0) {
      const temporalScores = this.analyzeTemporalPatterns(segment, context);
      scores.provider += temporalScores.provider * 0.3;
      scores.patient += temporalScores.patient * 0.3;
    }

    // Determine speaker based on scores
    const maxScore = Math.max(scores.provider, scores.patient);
    
    if (maxScore < this.config.confidenceThreshold) {
      return 'unknown';
    }

    return scores.provider > scores.patient ? 'provider' : 'patient';
  }

  /**
   * Analyze text patterns to identify speaker
   */
  private analyzePatterns(text: string): { provider: number; patient: number } {
    const scores = { provider: 0, patient: 0 };
    const normalizedText = text.toLowerCase();

    // Check provider patterns
    for (const pattern of this.providerPatterns) {
      let patternScore = 0;

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (normalizedText.includes(keyword)) {
          patternScore += 0.3;
        }
      }

      // Check phrases (regex patterns)
      for (const phrase of pattern.phrases) {
        if (phrase.test(text)) {
          patternScore += 0.7;
        }
      }

      scores.provider += patternScore * pattern.weight;
    }

    // Check patient patterns
    for (const pattern of this.patientPatterns) {
      let patternScore = 0;

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (normalizedText.includes(keyword)) {
          patternScore += 0.3;
        }
      }

      // Check phrases (regex patterns)
      for (const phrase of pattern.phrases) {
        if (phrase.test(text)) {
          patternScore += 0.7;
        }
      }

      scores.patient += patternScore * pattern.weight;
    }

    // Normalize scores
    const maxScore = Math.max(scores.provider, scores.patient, 1);
    return {
      provider: scores.provider / maxScore,
      patient: scores.patient / maxScore
    };
  }

  /**
   * Analyze conversation context
   */
  private analyzeContext(
    segment: TranscriptSegment, 
    context: TranscriptSegment[]
  ): { provider: number; patient: number } {
    const scores = { provider: 0, patient: 0 };
    const recentContext = context.slice(-this.config.contextWindowSize);

    if (recentContext.length === 0) {
      return scores;
    }

    // Analyze conversation flow
    const speakerContext = this.buildSpeakerContext(recentContext);
    
    // Question-answer patterns
    const lastSegment = recentContext[recentContext.length - 1];
    if (this.isQuestion(lastSegment.text)) {
      if (lastSegment.speaker === 'provider') {
        scores.patient += 0.8; // Provider asked, patient likely responds
      } else if (lastSegment.speaker === 'patient') {
        scores.provider += 0.8; // Patient asked, provider likely responds
      }
    }

    // Response patterns
    if (this.isResponse(segment.text)) {
      if (lastSegment.speaker === 'provider') {
        scores.patient += 0.6;
      } else if (lastSegment.speaker === 'patient') {
        scores.provider += 0.6;
      }
    }

    // Conversation dominance
    if (speakerContext.dominantSpeaker !== 'unknown') {
      if (speakerContext.dominantSpeaker === 'provider') {
        scores.provider += 0.2;
      } else {
        scores.patient += 0.2;
      }
    }

    return scores;
  }

  /**
   * Analyze temporal conversation patterns
   */
  private analyzeTemporalPatterns(
    segment: TranscriptSegment, 
    context: TranscriptSegment[]
  ): { provider: number; patient: number } {
    const scores = { provider: 0, patient: 0 };
    
    if (context.length === 0) {
      return scores;
    }

    const lastSegment = context[context.length - 1];
    
    // Speaker alternation bias
    if (lastSegment.speaker === 'provider') {
      scores.patient += this.config.alternationBias;
    } else if (lastSegment.speaker === 'patient') {
      scores.provider += this.config.alternationBias;
    }

    // Analyze speaking time patterns
    const recentSegments = context.slice(-3);
    const providerSegments = recentSegments.filter(s => s.speaker === 'provider').length;
    const patientSegments = recentSegments.filter(s => s.speaker === 'patient').length;

    // If one speaker has been dominant, bias toward the other
    if (providerSegments > patientSegments + 1) {
      scores.patient += 0.3;
    } else if (patientSegments > providerSegments + 1) {
      scores.provider += 0.3;
    }

    return scores;
  }

  /**
   * Build speaker context from recent segments
   */
  private buildSpeakerContext(segments: TranscriptSegment[]): SpeakerContext {
    const providerCount = segments.filter(s => s.speaker === 'provider').length;
    const patientCount = segments.filter(s => s.speaker === 'patient').length;
    
    let dominantSpeaker: 'provider' | 'patient' | 'unknown' = 'unknown';
    let conversationFlow: 'provider-led' | 'patient-led' | 'balanced' = 'balanced';

    if (providerCount > patientCount * 1.5) {
      dominantSpeaker = 'provider';
      conversationFlow = 'provider-led';
    } else if (patientCount > providerCount * 1.5) {
      dominantSpeaker = 'patient';
      conversationFlow = 'patient-led';
    }

    return {
      recentSegments: segments,
      conversationFlow,
      dominantSpeaker
    };
  }

  /**
   * Check if text is a question
   */
  private isQuestion(text: string): boolean {
    const questionPatterns = [
      /\?$/,
      /^(how|what|when|where|why|who|which|can|could|would|will|do|does|did|is|are|was|were)/i,
      /\b(tell me|explain|describe)\b/i
    ];

    return questionPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Check if text is a response
   */
  private isResponse(text: string): boolean {
    const responsePatterns = [
      /^(yes|no|yeah|yep|nope|okay|ok|sure|right|exactly|correct)/i,
      /^(i think|i believe|i feel|i guess|maybe|probably)/i,
      /^(well|so|actually|basically)/i
    ];

    return responsePatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Process multiple segments for speaker identification
   */
  processBatch(segments: TranscriptSegment[]): TranscriptSegment[] {
    const processedSegments: TranscriptSegment[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const context = processedSegments.slice(Math.max(0, i - this.config.contextWindowSize));
      
      const identifiedSpeaker = this.identifySpeaker(segment, context);
      
      processedSegments.push({
        ...segment,
        speaker: identifiedSpeaker
      });
    }

    return processedSegments;
  }

  /**
   * Add custom pattern for speaker identification
   */
  addProviderPattern(pattern: SpeakerPattern): void {
    this.providerPatterns.push(pattern);
  }

  /**
   * Add custom pattern for patient identification
   */
  addPatientPattern(pattern: SpeakerPattern): void {
    this.patientPatterns.push(pattern);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DiarizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): DiarizationConfig {
    return { ...this.config };
  }

  /**
   * Reset patterns to defaults
   */
  resetPatterns(): void {
    // Reinitialize with default patterns
    // This would restore the original patterns defined in the constructor
  }

  /**
   * Get confidence score for speaker identification
   */
  getConfidenceScore(segment: TranscriptSegment, context: TranscriptSegment[] = []): number {
    const patternScores = this.analyzePatterns(segment.text);
    const maxPatternScore = Math.max(patternScores.provider, patternScores.patient);
    
    let contextScore = 0;
    if (context.length > 0) {
      const contextScores = this.analyzeContext(segment, context);
      contextScore = Math.max(contextScores.provider, contextScores.patient);
    }

    // Combine scores
    return (maxPatternScore * 0.6) + (contextScore * 0.4);
  }

  /**
   * Analyze conversation statistics
   */
  analyzeConversation(segments: TranscriptSegment[]): {
    providerSegments: number;
    patientSegments: number;
    unknownSegments: number;
    averageConfidence: number;
    conversationFlow: string;
  } {
    const providerSegments = segments.filter(s => s.speaker === 'provider').length;
    const patientSegments = segments.filter(s => s.speaker === 'patient').length;
    const unknownSegments = segments.filter(s => s.speaker === 'unknown').length;

    const confidenceScores = segments.map((segment, index) => {
      const context = segments.slice(Math.max(0, index - this.config.contextWindowSize), index);
      return this.getConfidenceScore(segment, context);
    });

    const averageConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

    let conversationFlow = 'balanced';
    if (providerSegments > patientSegments * 1.5) {
      conversationFlow = 'provider-led';
    } else if (patientSegments > providerSegments * 1.5) {
      conversationFlow = 'patient-led';
    }

    return {
      providerSegments,
      patientSegments,
      unknownSegments,
      averageConfidence: averageConfidence || 0,
      conversationFlow
    };
  }
}