import {
  ClinicalDocumentation,
  SOAPNote,
  ClinicalEntity,
  TranscriptSegment,
} from '../models/types';

export interface DocumentationConfig {
  apiKey?: string;
  provider?: 'openai' | 'gemini';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiEndpoint?: string;
  enableEntityExtraction?: boolean;
  enableConfidenceScoring?: boolean;
  customPrompts?: {
    soapGeneration?: string;
    entityExtraction?: string;
    clinicalSummary?: string;
  };
}

export interface GenerationResult {
  documentation: ClinicalDocumentation;
  confidence: number;
  processingTime: number;
  tokensUsed?: number;
  suggestions?: string[];
}

export interface EntityExtractionResult {
  entities: ClinicalEntity[];
  confidence: number;
  processingTime: number;
}

export class DocumentationGenerator {
  private config: DocumentationConfig = {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.1,
    maxTokens: 2000,
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    enableEntityExtraction: true,
    enableConfidenceScoring: true
  };

  private conversationContext: TranscriptSegment[] = [];

  constructor(config?: DocumentationConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Generate complete clinical documentation from transcript
   */
  async generateDocumentation(transcript: TranscriptSegment[]): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Update conversation context
      this.conversationContext = transcript;

      // Generate SOAP note
      const soapNote = await this.generateSOAPNote(transcript);

      // Extract clinical entities
      const entityResult = await this.extractClinicalEntities(transcript);

      // Create documentation object
      const documentation: ClinicalDocumentation = {
        soapNote,
        clinicalEntities: entityResult.entities,
        lastUpdated: new Date(),
        isFinalized: false,
      };

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(soapNote, entityResult.entities);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(documentation, transcript);

      

      return {
        documentation,
        confidence,
        processingTime: Date.now() - startTime,
        suggestions,
      };
    } catch (error) {
      throw new Error(
        `Documentation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update existing documentation with new transcript segments
   */
  async updateDocumentation(
    currentDoc: ClinicalDocumentation,
    newSegments: TranscriptSegment[]
  ): Promise<ClinicalDocumentation> {
    try {
      // Combine existing context with new segments
      const fullTranscript = [...this.conversationContext, ...newSegments];
      this.conversationContext = fullTranscript;

      // Generate incremental updates
      const updatedSoap = await this.updateSOAPNote(
        currentDoc.soapNote,
        newSegments
      );
      const newEntities = await this.extractClinicalEntities(newSegments);

      // Merge entities (avoid duplicates)
      const mergedEntities = this.mergeEntities(
        currentDoc.clinicalEntities,
        newEntities.entities
      );

      return {
        ...currentDoc,
        soapNote: updatedSoap,
        clinicalEntities: mergedEntities,
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Documentation update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate SOAP note from transcript
   */
  async generateSOAPNote(transcript: TranscriptSegment[]): Promise<SOAPNote> {
    const conversationText = this.formatTranscriptForAI(transcript);

    const prompt = this.config.customPrompts?.soapGeneration || this.getDefaultSOAPPrompt();
    const fullPrompt = `${prompt}\n\nConversation:\n${conversationText}\n\nGenerate a SOAP note in JSON format:`;

    try {
      const response = await this.callAI(fullPrompt);
      return this.parseSOAPResponse(response);
    } catch (error) {
      // Fallback to basic SOAP note structure
      return this.generateFallbackSOAP(transcript);
    }
  }

  /**
   * Extract clinical entities from transcript
   */
  async extractClinicalEntities(
    transcript: TranscriptSegment[] | string
  ): Promise<EntityExtractionResult> {
    const startTime = Date.now();

    const text = Array.isArray(transcript)
      ? this.formatTranscriptForAI(transcript)
      : transcript;

    const prompt = this.config.customPrompts?.entityExtraction || this.getDefaultEntityPrompt();
    const fullPrompt = `${prompt}\n\nText: ${text}\n\nExtract clinical entities in JSON format:`;

    try {
      const response = await this.callAI(fullPrompt);
      const entities = this.parseEntityResponse(response);

      return {
        entities,
        confidence: this.calculateEntityConfidence(entities),
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      // Return empty result on error
      return {
        entities: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Refine specific SOAP section with additional context
   */
  async refineSectionWithContext(
    section: keyof SOAPNote,
    content: string,
    context: string
  ): Promise<string> {
    const prompt = `Refine the following ${section.toUpperCase()} section of a SOAP note based on the additional context provided.

Current ${section} content:
${content}

Additional context:
${context}

Provide an improved version that incorporates the new information while maintaining medical accuracy and proper formatting:`;

    try {
      const response = await this.callAI(prompt);
      return response.trim();
    } catch (error) {
      // Return original content if refinement fails
      return content;
    }
  }

  /**
   * Update SOAP note with new information
   */
  private async updateSOAPNote(
    currentSOAP: SOAPNote,
    newSegments: TranscriptSegment[]
  ): Promise<SOAPNote> {
    const newText = this.formatTranscriptForAI(newSegments);

    if (newText.trim().length === 0) {
      return currentSOAP;
    }

    const prompt = `Update the following SOAP note with new information from the conversation.

Current SOAP Note:
${JSON.stringify(currentSOAP, null, 2)}

New conversation segments:
${newText}

Provide the updated SOAP note in JSON format, incorporating any new relevant information:`;

    try {
      const response = await this.callAI(prompt);
      return this.parseSOAPResponse(response);
    } catch (error) {
      // Return current SOAP if update fails
      return currentSOAP;
    }
  }

  /**
   * Format transcript for AI processing
   */
  private formatTranscriptForAI(transcript: TranscriptSegment[]): string {
    return transcript.map((s) => `${s.speaker.toUpperCase()}: ${s.text}`).join('\n');
  }

  /**
   * Parse SOAP note response from AI
   */
  private parseSOAPResponse(response: string): SOAPNote {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        subjective: {
          chiefComplaint: parsed.subjective?.chiefComplaint || '',
          historyOfPresentIllness: parsed.subjective?.historyOfPresentIllness || '',
          reviewOfSystems: parsed.subjective?.reviewOfSystems || '',
        },
        objective: {
          vitalSigns: parsed.objective?.vitalSigns || {},
          physicalExam: parsed.objective?.physicalExam || '',
        },
        assessment: {
          diagnoses: Array.isArray(parsed.assessment?.diagnoses)
            ? parsed.assessment.diagnoses
            : [],
          differentialDiagnoses: Array.isArray(parsed.assessment?.differentialDiagnoses)
            ? parsed.assessment.differentialDiagnoses
            : [],
        },
        plan: {
          medications: Array.isArray(parsed.plan?.medications)
            ? parsed.plan.medications
            : [],
          procedures: Array.isArray(parsed.plan?.procedures)
            ? parsed.plan.procedures
            : [],
          followUp: parsed.plan?.followUp || '',
          patientInstructions: parsed.plan?.patientInstructions || '',
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to parse SOAP response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse entity extraction response from AI
   */
  private parseEntityResponse(response: string): ClinicalEntity[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed
        .map((entity: any) => ({
          type: entity.type || 'unknown',
          value: entity.value || '',
          confidence: entity.confidence || 0.5,
          context: entity.context || '',
        }))
        .filter(
          (entity: ClinicalEntity) =>
            entity.value &&
            ['medication', 'diagnosis', 'symptom', 'procedure', 'allergy'].includes(entity.type)
        );
    } catch (error) {
      return [];
    }
  }

  /**
   * Call AI service with configured provider
   */
  private async callAI(prompt: string): Promise<string> {
    if (this.config.provider === 'gemini') {
      return this.callGemini(prompt);
    }
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(this.config.apiEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant specialized in clinical documentation. Generate accurate, professional medical documentation based on patient-provider conversations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AI API request failed: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Gemini provider using Generative Language API (v1beta)
   */
  private async callGemini(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error('Gemini API key not configured');

    const model = this.config.model || 'gemini-2.5-flash';
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    const requestBody: any = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: this.config.temperature ?? 0.1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: this.config.maxTokens ?? 2000
      }
    };

    if (this.config.provider === 'gemini') {
      requestBody.responseMimeType = 'application/json';
    }

    const url = `${baseUrl}/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) throw new Error('No content returned from Gemini');
    return text;
  }

  /**
   * Generate fallback SOAP note
   */
  private generateFallbackSOAP(transcript: TranscriptSegment[]): SOAPNote {
    const patientSegments = transcript.filter(s => s.speaker === 'patient');

    // Extract basic information from conversation
    const chiefComplaint = this.extractChiefComplaint(patientSegments);
    const symptoms = this.extractSymptoms(patientSegments);
    const medications = this.extractMentionedMedications(transcript);

    return {
      subjective: {
        chiefComplaint,
        historyOfPresentIllness: symptoms.join('. '),
        reviewOfSystems: ''
      },
      objective: {
        vitalSigns: {},
        physicalExam: ''
      },
      assessment: {
        diagnoses: [],
        differentialDiagnoses: []
      },
      plan: {
        medications: medications.map(med => ({ name: med })),
        procedures: [],
        followUp: '',
        patientInstructions: ''
      }
    };
  }

  /**
   * Extract chief complaint from patient segments
   */
  private extractChiefComplaint(patientSegments: TranscriptSegment[]): string {
    if (patientSegments.length === 0) return '';
    
    // Look for first substantial patient statement
    const firstSegment = patientSegments.find(s => s.text.length > 10);
    return firstSegment?.text || patientSegments[0]?.text || '';
  }

  /**
   * Extract symptoms from patient segments
   */
  private extractSymptoms(patientSegments: TranscriptSegment[]): string[] {
    const symptomKeywords = ['pain', 'hurt', 'ache', 'feel', 'nausea', 'dizzy', 'tired', 'fever'];
    
    return patientSegments
      .filter(segment => 
        symptomKeywords.some(keyword => 
          segment.text.toLowerCase().includes(keyword)
        )
      )
      .map(segment => segment.text)
      .slice(0, 3); // Limit to first 3 symptom mentions
  }

  /**
   * Extract mentioned medications
   */
  private extractMentionedMedications(transcript: TranscriptSegment[]): string[] {
    const medicationPatterns = [
      /\b\w+cillin\b/gi,
      /\b\w+pril\b/gi,
      /\bibuprofen\b/gi,
      /\btylenol\b/gi,
      /\baspirin\b/gi,
      /\bmetformin\b/gi,
      /\blisinopril\b/gi
    ];

    const medications: string[] = [];
    
    transcript.forEach(segment => {
      medicationPatterns.forEach(pattern => {
        const matches = segment.text.match(pattern);
        if (matches) {
          medications.push(...matches);
        }
      });
    });

    return [...new Set(medications)]; // Remove duplicates
  }

  /**
   * Merge clinical entities, avoiding duplicates
   */
  private mergeEntities(existing: ClinicalEntity[], newEntities: ClinicalEntity[]): ClinicalEntity[] {
    const merged = [...existing];
    
    newEntities.forEach(newEntity => {
      const isDuplicate = existing.some(existingEntity => 
        existingEntity.type === newEntity.type &&
        existingEntity.value.toLowerCase() === newEntity.value.toLowerCase()
      );
      
      if (!isDuplicate) {
        merged.push(newEntity);
      }
    });
    
    return merged;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(soapNote: SOAPNote, entities: ClinicalEntity[]): number {
    let totalScore = 0;
    let components = 0;

    // SOAP completeness score
    const soapScore = this.calculateSOAPCompleteness(soapNote);
    totalScore += soapScore;
    components++;

    // Entity confidence score
    if (entities.length > 0) {
      const entityScore = entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length;
      totalScore += entityScore;
      components++;
    }

    return components > 0 ? totalScore / components : 0;
  }

  /**
   * Calculate SOAP note completeness
   */
  private calculateSOAPCompleteness(soapNote: SOAPNote): number {
    let score = 0;
    let maxScore = 0;

    // Subjective section
    maxScore += 3;
    if (soapNote.subjective.chiefComplaint) score += 1;
    if (soapNote.subjective.historyOfPresentIllness) score += 1;
    if (soapNote.subjective.reviewOfSystems) score += 1;

    // Objective section
    maxScore += 2;
    if (soapNote.objective.physicalExam) score += 1;
    if (soapNote.objective.vitalSigns && Object.keys(soapNote.objective.vitalSigns).length > 0) score += 1;

    // Assessment section
    maxScore += 1;
    if (soapNote.assessment.diagnoses.length > 0) score += 1;

    // Plan section
    maxScore += 2;
    if (soapNote.plan.medications && soapNote.plan.medications.length > 0) score += 1;
    if (soapNote.plan.followUp || soapNote.plan.patientInstructions) score += 1;

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Calculate entity extraction confidence
   */
  private calculateEntityConfidence(entities: ClinicalEntity[]): number {
    if (entities.length === 0) return 0;
    
    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return totalConfidence / entities.length;
  }

  /**
   * Generate suggestions for improvement
   */
  private async generateSuggestions(
    documentation: ClinicalDocumentation, 
    _transcript: TranscriptSegment[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Check for missing information
    if (!documentation.soapNote.subjective.chiefComplaint) {
      suggestions.push('Consider adding a clear chief complaint');
    }

    if (documentation.soapNote.assessment.diagnoses.length === 0) {
      suggestions.push('No diagnoses identified - review assessment section');
    }

    if (!documentation.soapNote.objective.vitalSigns || 
        Object.keys(documentation.soapNote.objective.vitalSigns).length === 0) {
      suggestions.push('Consider adding vital signs to objective section');
    }

    if (!documentation.soapNote.plan.followUp) {
      suggestions.push('Consider adding follow-up instructions');
    }

    return suggestions;
  }

  /**
   * Get default SOAP generation prompt
   */
  private getDefaultSOAPPrompt(): string {
    return `You are a clinical documentation assistant. Convert the conversation into a SOAP note expressed as a JSON object with these keys:
{
  "subjective": {
    "chiefComplaint": string,
    "historyOfPresentIllness": string,
    "reviewOfSystems": string
  },
  "objective": {
    "vitalSigns": {
      "bloodPressure": string,
      "heartRate": number | null,
      "temperature": number | null,
      "respiratoryRate": number | null,
      "oxygenSaturation": number | null
    },
    "physicalExam": string
  },
  "assessment": {
    "diagnoses": string[],
    "differentialDiagnoses": string[]
  },
  "plan": {
    "medications": {"name": string, "dosage": string, "frequency": string}[],
    "procedures": string[],
    "followUp": string,
    "patientInstructions": string
  }
}
Rules:
- Only include facts explicitly stated in the conversation.
- If information is absent, use an empty string, empty array, or null (for vitals) instead of fabricating values.
- Respond with JSON only. Do not include explanations, markdown, or additional text.`;
  }

  /**
   * Get default entity extraction prompt
   */
  private getDefaultEntityPrompt(): string {
    return `Extract clinical entities mentioned explicitly in the text. Respond with a JSON array. Each element must be an object with:
{
  "type": "medication" | "diagnosis" | "symptom" | "procedure" | "allergy",
  "value": string,
  "confidence": number,
  "context": string
}
Rules:
- Only include entities that are clearly stated.
- confidence must be between 0 and 1. Use lower scores if the mention is uncertain.
- context should be a short snippet from the conversation where the entity appears.
- Respond with JSON only. Do not include explanations or extra text.`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DocumentationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): DocumentationConfig {
    return { ...this.config };
  }

  /**
   * Clear conversation context
   */
  clearContext(): void {
    this.conversationContext = [];
  }

  /**
   * Get conversation context
   */
  getContext(): TranscriptSegment[] {
    return [...this.conversationContext];
  }
}