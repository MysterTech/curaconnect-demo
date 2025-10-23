/**
 * Clinical Entity Extraction Service
 * Extracts medical entities from transcript with confidence scores
 */

export interface ClinicalEntity {
  type: 'symptom' | 'diagnosis' | 'medication' | 'procedure' | 'anatomy' | 'vital-sign' | 'lab-value' | 'allergy';
  value: string;
  confidence: number;
  context?: string;
  timestamp?: number;
}

export interface SOAPElements {
  subjective: ClinicalEntity[];
  objective: ClinicalEntity[];
  assessment: ClinicalEntity[];
  plan: ClinicalEntity[];
}

export class ClinicalEntityExtractor {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  async extractEntities(transcript: string): Promise<ClinicalEntity[]> {
    if (!this.apiKey || !transcript) {
      return [];
    }

    try {
      const prompt = `You are a medical NLP system. Extract clinical entities from this medical consultation transcript.

For each entity found, provide:
1. Type: symptom, diagnosis, medication, procedure, anatomy, vital-sign, lab-value, or allergy
2. Value: the exact medical term
3. Confidence: 0.0 to 1.0 (how confident you are this is a valid medical entity)

Transcript:
${transcript}

Return ONLY a JSON array of entities in this exact format:
[
  {"type": "symptom", "value": "chest pain", "confidence": 0.95},
  {"type": "vital-sign", "value": "BP 150/95", "confidence": 0.98}
]

Rules:
- Only extract actual medical entities mentioned
- Do not infer or add entities not in transcript
- Confidence should reflect certainty (0.9+ for explicit mentions, 0.7-0.9 for implied, <0.7 for uncertain)
- Return empty array [] if no entities found`;

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
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in response');
        return [];
      }

      const entities: ClinicalEntity[] = JSON.parse(jsonMatch[0]);
      return entities;

    } catch (error) {
      console.error('Failed to extract clinical entities:', error);
      return [];
    }
  }

  async extractSOAPElements(transcript: string): Promise<SOAPElements> {
    if (!this.apiKey || !transcript) {
      return { subjective: [], objective: [], assessment: [], plan: [] };
    }

    try {
      const prompt = `You are a medical documentation expert. Analyze this consultation transcript and categorize clinical entities into SOAP format.

Transcript:
${transcript}

Extract entities and categorize them into:
- Subjective: Patient's complaints, symptoms, history (what patient says)
- Objective: Examination findings, vital signs, lab results (what doctor observes)
- Assessment: Diagnoses, clinical impressions
- Plan: Treatment, medications, follow-up, procedures

Return ONLY a JSON object in this exact format:
{
  "subjective": [{"type": "symptom", "value": "chest pain", "confidence": 0.95}],
  "objective": [{"type": "vital-sign", "value": "BP 150/95", "confidence": 0.98}],
  "assessment": [{"type": "diagnosis", "value": "hypertension", "confidence": 0.90}],
  "plan": [{"type": "medication", "value": "Amlodipine 10mg", "confidence": 0.95}]
}

Rules:
- Only include entities explicitly mentioned
- Confidence 0.9+ for clear mentions, 0.7-0.9 for implied, <0.7 for uncertain
- Empty arrays for sections with no entities`;

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
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON object found in response');
        return { subjective: [], objective: [], assessment: [], plan: [] };
      }

      const soapElements: SOAPElements = JSON.parse(jsonMatch[0]);
      return soapElements;

    } catch (error) {
      console.error('Failed to extract SOAP elements:', error);
      return { subjective: [], objective: [], assessment: [], plan: [] };
    }
  }

  getEntityColor(type: ClinicalEntity['type']): string {
    const colors = {
      'symptom': 'bg-red-100 text-red-800 border-red-200',
      'diagnosis': 'bg-purple-100 text-purple-800 border-purple-200',
      'medication': 'bg-blue-100 text-blue-800 border-blue-200',
      'procedure': 'bg-green-100 text-green-800 border-green-200',
      'anatomy': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'vital-sign': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'lab-value': 'bg-pink-100 text-pink-800 border-pink-200',
      'allergy': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  }
}

export const clinicalEntityExtractor = new ClinicalEntityExtractor();
