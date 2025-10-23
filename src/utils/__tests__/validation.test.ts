import {
  validateSession,
  validateTranscriptSegment,
  validateClinicalDocumentation,
  validateSOAPNote,
  validateVitalSigns,
  validateMedication,
  validateClinicalEntity,
  validatePatientContext,
  validateSessionMetadata,
  isValidSession,
  hasRequiredSessionFields
} from '../validation';
import { Session, TranscriptSegment } from "../../models/types";

describe('Validation Utils', () => {
  let validSession: Session;
  let validTranscriptSegment: TranscriptSegment;

  beforeEach(() => {
    validSession = global.createMockSession();
    
    validTranscriptSegment = {
      id: 'segment-1',
      timestamp: 60,
      speaker: 'provider',
      text: 'How are you feeling today?',
      confidence: 0.95
    };
  });

  describe('validateSession', () => {
    it('should return no errors for valid session', () => {
      const errors = validateSession(validSession);
      expect(errors).toEqual([]);
    });

    it('should validate required ID field', () => {
      const invalidSession = { ...validSession, id: '' };
      const errors = validateSession(invalidSession);
      
      expect(errors).toContain('Session ID is required and must be a non-empty string');
    });

    it('should validate ID type', () => {
      const invalidSession = { ...validSession, id: 123 as any };
      const errors = validateSession(invalidSession);
      
      expect(errors).toContain('Session ID is required and must be a non-empty string');
    });

    it('should validate createdAt field', () => {
      const invalidSession = { ...validSession, createdAt: 'invalid-date' as any };
      const errors = validateSession(invalidSession);
      
      expect(errors).toContain('Created date is required and must be a valid Date');
    });

    it('should validate updatedAt field', () => {
      const invalidSession = { ...validSession, updatedAt: null as any };
      const errors = validateSession(invalidSession);
      
      expect(errors).toContain('Updated date is required and must be a valid Date');
    });

    it('should validate status field', () => {
      const invalidSession = { ...validSession, status: 'invalid-status' as any };
      const errors = validateSession(invalidSession);
      
      expect(errors).toContain('Status must be one of: active, paused, completed');
    });

    it('should validate transcript array', () => {
      const invalidSession = { ...validSession, transcript: 'not-an-array' as any };
      const errors = validateSession(invalidSession);
      
      expect(errors).toContain('Transcript must be an array');
    });

    it('should validate transcript segments', () => {
      const invalidSegment = { ...validTranscriptSegment, text: '' };
      const invalidSession = { ...validSession, transcript: [invalidSegment] };
      const errors = validateSession(invalidSession);
      
      expect(errors.some(error => error.includes('Text is required'))).toBe(true);
    });

    it('should validate documentation', () => {
      const invalidDoc = { ...validSession.documentation, soapNote: null as any };
      const invalidSession = { ...validSession, documentation: invalidDoc };
      const errors = validateSession(invalidSession);
      
      expect(errors.some(error => error.includes('SOAP note is required'))).toBe(true);
    });

    it('should validate metadata', () => {
      const invalidMetadata = { ...validSession.metadata, duration: -1 };
      const invalidSession = { ...validSession, metadata: invalidMetadata };
      const errors = validateSession(invalidSession);
      
      expect(errors.some(error => error.includes('Duration must be a non-negative number'))).toBe(true);
    });
  });

  describe('validateTranscriptSegment', () => {
    it('should return no errors for valid segment', () => {
      const errors = validateTranscriptSegment(validTranscriptSegment);
      expect(errors).toEqual([]);
    });

    it('should validate segment ID', () => {
      const invalidSegment = { ...validTranscriptSegment, id: '' };
      const errors = validateTranscriptSegment(invalidSegment);
      
      expect(errors).toContain('Segment ID is required and must be a string');
    });

    it('should validate timestamp', () => {
      const invalidSegment = { ...validTranscriptSegment, timestamp: -5 };
      const errors = validateTranscriptSegment(invalidSegment);
      
      expect(errors).toContain('Timestamp is required and must be a non-negative number');
    });

    it('should validate speaker', () => {
      const invalidSegment = { ...validTranscriptSegment, speaker: 'invalid-speaker' as any };
      const errors = validateTranscriptSegment(invalidSegment);
      
      expect(errors).toContain('Speaker must be one of: provider, patient, unknown');
    });

    it('should validate text', () => {
      const invalidSegment = { ...validTranscriptSegment, text: '' };
      const errors = validateTranscriptSegment(invalidSegment);
      
      expect(errors).toContain('Text is required and must be a non-empty string');
    });

    it('should validate confidence range', () => {
      const invalidSegment = { ...validTranscriptSegment, confidence: 1.5 };
      const errors = validateTranscriptSegment(invalidSegment);
      
      expect(errors).toContain('Confidence must be a number between 0 and 1');
    });

    it('should allow undefined confidence', () => {
      const segmentWithoutConfidence = { ...validTranscriptSegment };
      delete segmentWithoutConfidence.confidence;
      
      const errors = validateTranscriptSegment(segmentWithoutConfidence);
      expect(errors).toEqual([]);
    });
  });

  describe('validateClinicalDocumentation', () => {
    it('should return no errors for valid documentation', () => {
      const errors = validateClinicalDocumentation(validSession.documentation);
      expect(errors).toEqual([]);
    });

    it('should require SOAP note', () => {
      const invalidDoc = { ...validSession.documentation, soapNote: null as any };
      const errors = validateClinicalDocumentation(invalidDoc);
      
      expect(errors).toContain('SOAP note is required');
    });

    it('should validate clinical entities array', () => {
      const invalidDoc = { ...validSession.documentation, clinicalEntities: 'not-array' as any };
      const errors = validateClinicalDocumentation(invalidDoc);
      
      expect(errors).toContain('Clinical entities must be an array');
    });

    it('should validate lastUpdated date', () => {
      const invalidDoc = { ...validSession.documentation, lastUpdated: 'invalid-date' as any };
      const errors = validateClinicalDocumentation(invalidDoc);
      
      expect(errors).toContain('Last updated date is required and must be a valid Date');
    });

    it('should validate isFinalized boolean', () => {
      const invalidDoc = { ...validSession.documentation, isFinalized: 'not-boolean' as any };
      const errors = validateClinicalDocumentation(invalidDoc);
      
      expect(errors).toContain('isFinalized must be a boolean');
    });
  });

  describe('validateSOAPNote', () => {
    it('should return no errors for valid SOAP note', () => {
      const errors = validateSOAPNote(validSession.documentation.soapNote);
      expect(errors).toEqual([]);
    });

    it('should require subjective section', () => {
      const invalidSOAP = { ...validSession.documentation.soapNote, subjective: null as any };
      const errors = validateSOAPNote(invalidSOAP);
      
      expect(errors).toContain('Subjective section is required');
    });

    it('should require objective section', () => {
      const invalidSOAP = { ...validSession.documentation.soapNote, objective: null as any };
      const errors = validateSOAPNote(invalidSOAP);
      
      expect(errors).toContain('Objective section is required');
    });

    it('should require assessment section', () => {
      const invalidSOAP = { ...validSession.documentation.soapNote, assessment: null as any };
      const errors = validateSOAPNote(invalidSOAP);
      
      expect(errors).toContain('Assessment section is required');
    });

    it('should validate assessment diagnoses array', () => {
      const invalidSOAP = {
        ...validSession.documentation.soapNote,
        assessment: { diagnoses: 'not-array' as any }
      };
      const errors = validateSOAPNote(invalidSOAP);
      
      expect(errors).toContain('Assessment diagnoses must be an array');
    });

    it('should require plan section', () => {
      const invalidSOAP = { ...validSession.documentation.soapNote, plan: null as any };
      const errors = validateSOAPNote(invalidSOAP);
      
      expect(errors).toContain('Plan section is required');
    });
  });

  describe('validateVitalSigns', () => {
    const validVitals = {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      respiratoryRate: 16,
      oxygenSaturation: 98
    };

    it('should return no errors for valid vital signs', () => {
      const errors = validateVitalSigns(validVitals);
      expect(errors).toEqual([]);
    });

    it('should validate heart rate range', () => {
      const invalidVitals = { ...validVitals, heartRate: -5 };
      const errors = validateVitalSigns(invalidVitals);
      
      expect(errors).toContain('Heart rate must be a positive number');
    });

    it('should validate temperature range', () => {
      const invalidVitals = { ...validVitals, temperature: 150 };
      const errors = validateVitalSigns(invalidVitals);
      
      expect(errors).toContain('Temperature must be a number between 90 and 110 degrees');
    });

    it('should validate respiratory rate', () => {
      const invalidVitals = { ...validVitals, respiratoryRate: 0 };
      const errors = validateVitalSigns(invalidVitals);
      
      expect(errors).toContain('Respiratory rate must be a positive number');
    });

    it('should validate oxygen saturation range', () => {
      const invalidVitals = { ...validVitals, oxygenSaturation: 150 };
      const errors = validateVitalSigns(invalidVitals);
      
      expect(errors).toContain('Oxygen saturation must be a number between 0 and 100');
    });
  });

  describe('validateMedication', () => {
    const validMedication = {
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'daily',
      route: 'oral'
    };

    it('should return no errors for valid medication', () => {
      const errors = validateMedication(validMedication);
      expect(errors).toEqual([]);
    });

    it('should require medication name', () => {
      const invalidMedication = { ...validMedication, name: '' };
      const errors = validateMedication(invalidMedication);
      
      expect(errors).toContain('Medication name is required and must be a non-empty string');
    });

    it('should validate name type', () => {
      const invalidMedication = { ...validMedication, name: 123 as any };
      const errors = validateMedication(invalidMedication);
      
      expect(errors).toContain('Medication name is required and must be a non-empty string');
    });
  });

  describe('validateClinicalEntity', () => {
    const validEntity = {
      type: 'medication' as const,
      value: 'Lisinopril',
      confidence: 0.95,
      context: 'Patient is taking this medication'
    };

    it('should return no errors for valid clinical entity', () => {
      const errors = validateClinicalEntity(validEntity);
      expect(errors).toEqual([]);
    });

    it('should validate entity type', () => {
      const invalidEntity = { ...validEntity, type: 'invalid-type' as any };
      const errors = validateClinicalEntity(invalidEntity);
      
      expect(errors).toContain('Entity type must be one of: medication, diagnosis, symptom, procedure, allergy');
    });

    it('should validate entity value', () => {
      const invalidEntity = { ...validEntity, value: '' };
      const errors = validateClinicalEntity(invalidEntity);
      
      expect(errors).toContain('Entity value is required and must be a non-empty string');
    });

    it('should validate confidence range', () => {
      const invalidEntity = { ...validEntity, confidence: 2.0 };
      const errors = validateClinicalEntity(invalidEntity);
      
      expect(errors).toContain('Confidence must be a number between 0 and 1');
    });
  });

  describe('validatePatientContext', () => {
    it('should return no errors for valid patient context', () => {
      const validContext = {
        identifier: 'patient-123',
        visitType: 'follow-up'
      };
      
      const errors = validatePatientContext(validContext);
      expect(errors).toEqual([]);
    });

    it('should validate identifier when provided', () => {
      const invalidContext = { identifier: '', visitType: 'follow-up' };
      const errors = validatePatientContext(invalidContext);
      
      expect(errors).toContain('Patient identifier must be a non-empty string if provided');
    });

    it('should validate visit type when provided', () => {
      const invalidContext = { identifier: 'patient-123', visitType: '' };
      const errors = validatePatientContext(invalidContext);
      
      expect(errors).toContain('Visit type must be a non-empty string if provided');
    });

    it('should allow empty context', () => {
      const errors = validatePatientContext({});
      expect(errors).toEqual([]);
    });
  });

  describe('validateSessionMetadata', () => {
    const validMetadata = {
      duration: 1800,
      audioQuality: 'high',
      processingStatus: 'completed' as const
    };

    it('should return no errors for valid metadata', () => {
      const errors = validateSessionMetadata(validMetadata);
      expect(errors).toEqual([]);
    });

    it('should validate duration', () => {
      const invalidMetadata = { ...validMetadata, duration: -100 };
      const errors = validateSessionMetadata(invalidMetadata);
      
      expect(errors).toContain('Duration must be a non-negative number');
    });

    it('should validate processing status', () => {
      const invalidMetadata = { ...validMetadata, processingStatus: 'invalid-status' as any };
      const errors = validateSessionMetadata(invalidMetadata);
      
      expect(errors).toContain('Processing status must be one of: pending, processing, completed, error');
    });
  });

  describe('isValidSession', () => {
    it('should return true for valid session', () => {
      expect(isValidSession(validSession)).toBe(true);
    });

    it('should return false for invalid session', () => {
      const invalidSession = { ...validSession, id: '' };
      expect(isValidSession(invalidSession)).toBe(false);
    });
  });

  describe('hasRequiredSessionFields', () => {
    it('should return true when all required fields are present', () => {
      expect(hasRequiredSessionFields(validSession)).toBe(true);
    });

    it('should return false when required fields are missing', () => {
      const incompleteSession = { id: 'test-id' };
      expect(hasRequiredSessionFields(incompleteSession)).toBe(false);
    });

    it('should return false when ID is missing', () => {
      const sessionWithoutId = { ...validSession };
      delete (sessionWithoutId as any).id;
      expect(hasRequiredSessionFields(sessionWithoutId)).toBe(false);
    });
  });
});