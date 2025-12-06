/**
 * TranscriptAnalyzer - Extracts structured data from medical transcripts
 * Uses Gemini AI to extract tasks, vital signs, and other clinical data
 */

import { EyeExamData } from "../models/types";

export interface ExtractedVitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface ExtractedTask {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: 'prescription' | 'follow-up' | 'test' | 'referral' | 'other';
}

export interface TranscriptAnalysisResult {
  vitalSigns: ExtractedVitalSigns;
  eyeExam?: EyeExamData;
  tasks: ExtractedTask[];
  chiefComplaint?: string;
  diagnosis?: string[];
}

export class TranscriptAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  async analyzeTranscript(transcript: string): Promise<TranscriptAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `You are a medical data extraction AI. Analyze the following medical consultation transcript and extract structured information.

TRANSCRIPT:
${transcript}

Extract the following information in JSON format:

1. VITAL SIGNS (if mentioned):
   - bloodPressure (format: "120/80")
   - heartRate (number)
   - temperature (number in Fahrenheit)
   - respiratoryRate (number)
   - oxygenSaturation (number, percentage)
   - weight (number in lbs)
   - height (number in inches)

2. EYE EXAM (if mentioned - for ophthalmology consultations):
   - visualAcuity: { left, right, both } (e.g., "20/20", "6/6")
   - intraocularPressure: { left, right } (e.g., "15 mmHg")
   - pupils: { left, right } (e.g., "PERRLA", "3mm reactive")
   - extraocularMovements (e.g., "Full in all directions")
   - confrontationFields (e.g., "Full to confrontation")
   - slitLampExam: { anteriorSegment, lens, cornea }
   - fundusExam: { opticDisc, macula, vessels, periphery }

3. TASKS (action items for the provider):
   - Prescriptions to write
   - Follow-up appointments to schedule
   - Tests to order
   - Referrals to make
   - Any other action items

4. CHIEF COMPLAINT (main reason for visit)

5. DIAGNOSES (if mentioned)

RULES:
- ONLY extract information explicitly mentioned in the transcript
- DO NOT infer or make up data
- If a field is not mentioned, omit it from the response
- For tasks, be specific and actionable
- Prioritize tasks as: high (urgent), medium (important), low (routine)
- Categorize tasks as: prescription, follow-up, test, referral, or other

Return ONLY valid JSON in this exact format:
{
  "vitalSigns": {
    "bloodPressure": "120/80",
    "heartRate": 72,
    "temperature": 98.6,
    "respiratoryRate": 16,
    "oxygenSaturation": 98,
    "weight": 150,
    "height": 68
  },
  "eyeExam": {
    "visualAcuity": {
      "left": "20/20",
      "right": "20/25",
      "both": "20/20"
    },
    "intraocularPressure": {
      "left": "15 mmHg",
      "right": "16 mmHg"
    },
    "pupils": {
      "left": "PERRLA",
      "right": "PERRLA"
    },
    "extraocularMovements": "Full in all directions",
    "confrontationFields": "Full to confrontation",
    "slitLampExam": {
      "anteriorSegment": "Clear",
      "lens": "Clear",
      "cornea": "Clear"
    },
    "fundusExam": {
      "opticDisc": "Sharp margins, cup-to-disc ratio 0.3",
      "macula": "Normal foveal reflex",
      "vessels": "Normal caliber",
      "periphery": "No tears or holes"
    }
  },
  "tasks": [
    {
      "text": "Write prescription for Lisinopril 10mg once daily",
      "priority": "high",
      "category": "prescription"
    },
    {
      "text": "Schedule follow-up in 2 weeks",
      "priority": "medium",
      "category": "follow-up"
    }
  ],
  "chiefComplaint": "Patient presents with...",
  "diagnosis": ["Hypertension", "Type 2 Diabetes"]
}

If no information is found for a section, return an empty object/array for that section.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.8,
              topK: 20,
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;

      console.log('🔍 Gemini raw response:', resultText);

      // Parse JSON response
      const result = JSON.parse(resultText);

      console.log('📊 Parsed result:', result);
      console.log('💉 Vital signs:', result.vitalSigns);
      console.log('👁️ Eye exam:', result.eyeExam);

      return {
        vitalSigns: result.vitalSigns || {},
        eyeExam: result.eyeExam,
        tasks: result.tasks || [],
        chiefComplaint: result.chiefComplaint,
        diagnosis: result.diagnosis || []
      };
    } catch (error) {
      console.error('Failed to analyze transcript:', error);
      throw error;
    }
  }

  /**
   * Quick extraction for just vital signs (faster, less tokens)
   */
  async extractVitalSigns(transcript: string): Promise<ExtractedVitalSigns> {
    const result = await this.analyzeTranscript(transcript);
    return result.vitalSigns;
  }

  /**
   * Quick extraction for just tasks
   */
  async extractTasks(transcript: string): Promise<ExtractedTask[]> {
    const result = await this.analyzeTranscript(transcript);
    return result.tasks;
  }
}

export const transcriptAnalyzer = new TranscriptAnalyzer();
