/**
 * Gemini AI Transcription Service
 * Uses Google's Gemini API for audio transcription (batch mode only)
 *
 * Requirements:
 * - A Google Cloud Project with the Gemini API enabled.
 * - An API Key obtained from Google Cloud.
 * - The API Key should be stored in your environment variables (e.g., .env file)
 *   and accessed via `import.meta.env.VITE_GEMINI_API_KEY` if using Vite.
 */

import {
  BaseTranscriptionService,
  TranscriptionConfig,
  TranscriptionResult,
} from "./TranscriptionService";
import { TranscriptSegment } from "../models/types";

export interface GeminiTranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

export class GeminiTranscriptionService extends BaseTranscriptionService {
  private apiKey: string;
  private readonly MODEL_NAME = "gemini-2.5-flash";
  private readonly API_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models";

  constructor(config?: TranscriptionConfig) {
    super(config);
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "⚠️ Gemini API key not found in environment variables. Please set VITE_GEMINI_API_KEY."
      );
    }
  }

  protected async doInitialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }
  }

  isSupported(): boolean {
    return this.apiKey.length > 0;
  }

  async startRealtimeTranscription(
    _onSegment: (segment: TranscriptSegment) => void
  ): Promise<void> {
    throw new Error(
      "Gemini does not support real-time transcription. Use batch transcription instead."
    );
  }

  async stopRealtimeTranscription(): Promise<void> {
    // No-op for Gemini batch mode
  }

  /**
   * Transcribe an audio blob using the Gemini API.
   * @param audioData The audio content as a Blob or ArrayBuffer.
   * @returns A Promise that resolves to TranscriptionResult.
   */
  async transcribe(
    audioData: Blob | ArrayBuffer
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    // Convert ArrayBuffer to Blob if needed
    const audioBlob =
      audioData instanceof Blob
        ? audioData
        : new Blob([audioData], { type: "audio/webm" });

    const geminiResult = await this.transcribeGemini(audioBlob);

    if (!geminiResult || !geminiResult.success) {
      throw new Error(geminiResult?.error || "Transcription failed");
    }

    // Parse transcription into segments with speaker diarization
    const segments = this.parseTranscriptionIntoSegments(geminiResult.text);

    return {
      segments,
      confidence: 0.9,
      processingTime: Date.now() - startTime,
      language: this.config.language,
    };
  }

  /**
   * Internal Gemini transcription method
   * @param audioBlob The audio content as a Blob.
   * @returns A Promise that resolves to GeminiTranscriptionResult.
   */
  private async transcribeGemini(
    audioBlob: Blob
  ): Promise<GeminiTranscriptionResult> {
    console.log("🔍 transcribeGemini called with blob:", {
      size: audioBlob?.size,
      type: audioBlob?.type,
      hasApiKey: !!this.apiKey,
    });

    if (!this.apiKey) {
      console.error("❌ No API key configured");
      return {
        text: "",
        success: false,
        error: "Gemini API key not configured. Please provide an API key.",
      };
    }

    if (!audioBlob || audioBlob.size === 0) {
      console.error("❌ Audio blob is empty or invalid");
      return {
        text: "",
        success: false,
        error: "Audio blob is empty or invalid.",
      };
    }

    try {
      console.log(
        `🎤 Starting Gemini transcription for ${audioBlob.size} bytes...`
      );

      const base64Audio = await this.blobToBase64(audioBlob);
      console.log(`📝 Converted to base64: ${base64Audio.length} characters`);

      const requestBody = {
        contents: [
          {
            parts: [
              { 
                text: `You are a medical transcription AI assistant. Transcribe the following medical consultation audio with high accuracy.

INSTRUCTIONS:
- Transcribe exactly what is said, including medical terminology, drug names, and clinical observations
- Preserve medical abbreviations and technical terms (e.g., "BP", "HR", "mg", "PRN")
- Use proper medical spelling (e.g., "hypertension" not "high blood pressure" if that's what was said)
- If multiple speakers are present, identify them as "Doctor:" and "Patient:" at the start of each speaker's turn
- Include filler words like "um", "uh" only if they're significant pauses
- Format numbers clearly (e.g., "120 over 80" for blood pressure)
- Maintain professional medical documentation standards

Provide ONLY the transcription text, no additional commentary or formatting.` 
              },
              {
                inlineData: {
                  mimeType: audioBlob.type || "audio/webm",
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      };

      const apiUrl = `${this.API_BASE_URL}/${this.MODEL_NAME}:generateContent?key=${this.apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API error response:", errorBody);
        throw new Error(
          `Gemini API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`
        );
      }

      const data = await response.json();
      console.log("📨 Gemini API response:", JSON.stringify(data, null, 2));

      if (!data.candidates || data.candidates.length === 0) {
        const rejectionReason = data.promptFeedback?.blockReason || "unknown";
        console.error(
          `❌ No transcription candidates. Block Reason: ${rejectionReason}`,
          "Full response:",
          data
        );
        throw new Error(
          `No transcription result from Gemini. Request may have been blocked due to: ${rejectionReason}.`
        );
      }

      const transcription = data.candidates[0].content.parts[0].text.trim();
      console.log(`✅ Transcription complete: "${transcription.substring(0, 200)}..."`);

      return {
        text: transcription,
        success: true,
      };
    } catch (error) {
      console.error("❌ Transcription error:", error);
      return {
        text: "",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Parse transcription text into segments with speaker diarization
   * Handles formats like "Doctor: text" and "Patient: text"
   */
  private parseTranscriptionIntoSegments(text: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    
    // Map speaker labels to valid speaker types
    const mapSpeaker = (label: string): "provider" | "patient" | "unknown" => {
      const normalized = label.toLowerCase();
      if (['doctor', 'physician', 'clinician', 'provider', 'nurse'].includes(normalized)) {
        return 'provider';
      } else if (normalized === 'patient') {
        return 'patient';
      }
      return 'unknown';
    };
    
    // Split by speaker labels (Doctor:, Patient:, etc.)
    const speakerPattern = /^(Doctor|Patient|Physician|Clinician|Provider|Nurse):\s*/gim;
    
    // Check if the text has speaker labels
    const hasSpeakerLabels = speakerPattern.test(text);
    speakerPattern.lastIndex = 0; // Reset regex
    
    if (hasSpeakerLabels) {
      // Split by lines and process each
      const lines = text.split('\n');
      let currentSpeaker: "provider" | "patient" | "unknown" = 'unknown';
      let currentText = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Check if line starts with speaker label
        const speakerMatch = trimmedLine.match(/^(Doctor|Patient|Physician|Clinician|Provider|Nurse):\s*(.*)$/i);
        
        if (speakerMatch) {
          // Save previous segment if exists
          if (currentText.trim()) {
            segments.push({
              id: this.generateSegmentId(),
              timestamp: 0,
              speaker: currentSpeaker,
              text: currentText.trim(),
              confidence: 0.9,
            });
          }
          
          // Start new segment
          currentSpeaker = mapSpeaker(speakerMatch[1]);
          currentText = speakerMatch[2];
        } else {
          // Continue current speaker's text
          currentText += (currentText ? ' ' : '') + trimmedLine;
        }
      }
      
      // Add final segment
      if (currentText.trim()) {
        segments.push({
          id: this.generateSegmentId(),
          timestamp: 0,
          speaker: currentSpeaker,
          text: currentText.trim(),
          confidence: 0.9,
        });
      }
    } else {
      // No speaker labels, treat as single segment
      segments.push({
        id: this.generateSegmentId(),
        timestamp: 0,
        speaker: 'unknown',
        text: text.trim(),
        confidence: 0.9,
      });
    }
    
    return segments.length > 0 ? segments : [{
      id: this.generateSegmentId(),
      timestamp: 0,
      speaker: 'unknown',
      text: text.trim(),
      confidence: 0.9,
    }];
  }

  /**
   * Convert an audio Blob to a base64 string suitable for the Gemini API.
   * @param blob The Blob to convert.
   * @returns A Promise that resolves to the base64 string.
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error("Failed to convert blob to base64."));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Checks if the API key has been configured.
   * @returns True if the API key is present, false otherwise.
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}
