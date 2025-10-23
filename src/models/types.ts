// Core data models for the Medical Scribe Application

export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "paused" | "completed";
  patientContext?: PatientContext;
  transcript: TranscriptSegment[];
  documentation: ClinicalDocumentation;
  metadata: SessionMetadata;
  // Additional properties used in services
  patientIdentifier?: string;
  visitType?: string;
}

export interface PatientContext {
  identifier?: string;
  visitType?: string;
}

export interface TranscriptSegment {
  id: string;
  timestamp: number;
  speaker: "provider" | "patient" | "unknown";
  text: string;
  confidence?: number;
}

export interface SessionMetadata {
  duration: number;
  audioQuality?: string;
  processingStatus: "pending" | "processing" | "completed" | "error";
  tasks?: Task[];
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: 'prescription' | 'follow-up' | 'test' | 'referral' | 'other';
  createdAt: Date;
}

export interface ClinicalDocumentation {
  soapNote: SOAPNote;
  clinicalEntities: ClinicalEntity[];
  lastUpdated: Date;
  isFinalized: boolean;
  clinicalNote?: string;
}

export interface SOAPNote {
  subjective: SubjectiveSection;
  objective: ObjectiveSection;
  assessment: AssessmentSection;
  plan: PlanSection;
}

export interface SubjectiveSection {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  reviewOfSystems?: string;
}

export interface ObjectiveSection {
  vitalSigns?: VitalSigns;
  physicalExam?: string;
}

export interface AssessmentSection {
  diagnoses: string[];
  differentialDiagnoses?: string[];
}

export interface PlanSection {
  medications?: Medication[];
  procedures?: string[];
  followUp?: string;
  patientInstructions?: string;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
}

export interface ClinicalEntity {
  type: "medication" | "diagnosis" | "symptom" | "procedure" | "allergy";
  value: string;
  confidence: number;
  context?: string;
}

// Recording and transcription related types
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

// Session filtering and querying types
export interface SessionFilter {
  status?: Session["status"];
  dateRange?: { start: Date; end: Date };
  patientIdentifier?: string;
  visitType?: string;
  durationRange?: {
    min: number;
    max: number;
  };
}

// Export format types
export type ExportFormat = "json" | "pdf" | "text";

// API response types for external services
export interface TranscriptionResponse {
  segments: TranscriptSegment[];
  confidence: number;
  processingTime: number;
}

export interface DocumentationGenerationResponse {
  documentation: ClinicalDocumentation;
  confidence: number;
  processingTime: number;
  suggestions?: string[];
}

// Error types for better error handling
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Configuration types
export interface AppConfig {
  apiKeys: {
    openai?: string;
    whisper?: string;
  };
  features: {
    realtimeTranscription: boolean;
    aiDocumentation: boolean;
    exportFormats: ExportFormat[];
  };
  storage: {
    maxSessions: number;
    retentionDays: number;
  };
}

// App settings for user preferences
export interface AppSettings {
  theme: "light" | "dark" | "system";
  language: string;
  autoSave: boolean;
  autoSaveInterval: number;
  transcriptionService: "whisper" | "browser" | "hybrid";
  documentationStyle: "soap" | "narrative" | "structured";
  privacyMode: boolean;
  sessionTimeout: number;
}
