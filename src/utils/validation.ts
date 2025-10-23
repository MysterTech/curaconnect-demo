import { 
  Session, 
  TranscriptSegment, 
  ClinicalDocumentation, 
  SOAPNote, 
  VitalSigns, 
  Medication,
  ClinicalEntity,
  PatientContext,
  SessionMetadata
} from '../models/types';

// Session validation functions
export const validateSession = (session: Partial<Session>): string[] => {
  const errors: string[] = [];

  if (!session.id || typeof session.id !== 'string' || session.id.trim() === '') {
    errors.push('Session ID is required and must be a non-empty string');
  }

  if (!session.createdAt || !(session.createdAt instanceof Date)) {
    errors.push('Created date is required and must be a valid Date');
  }

  if (!session.updatedAt || !(session.updatedAt instanceof Date)) {
    errors.push('Updated date is required and must be a valid Date');
  }

  if (!session.status || !['active', 'paused', 'completed'].includes(session.status)) {
    errors.push('Status must be one of: active, paused, completed');
  }

  if (session.transcript && !Array.isArray(session.transcript)) {
    errors.push('Transcript must be an array');
  }

  if (session.transcript) {
    session.transcript.forEach((segment, index) => {
      const segmentErrors = validateTranscriptSegment(segment);
      segmentErrors.forEach(error => errors.push(`Transcript segment ${index}: ${error}`));
    });
  }

  if (session.documentation) {
    const docErrors = validateClinicalDocumentation(session.documentation);
    docErrors.forEach(error => errors.push(`Documentation: ${error}`));
  }

  if (session.metadata) {
    const metadataErrors = validateSessionMetadata(session.metadata);
    metadataErrors.forEach(error => errors.push(`Metadata: ${error}`));
  }

  return errors;
};

export const validateTranscriptSegment = (segment: Partial<TranscriptSegment>): string[] => {
  const errors: string[] = [];

  if (!segment.id || typeof segment.id !== 'string') {
    errors.push('Segment ID is required and must be a string');
  }

  if (typeof segment.timestamp !== 'number' || segment.timestamp < 0) {
    errors.push('Timestamp is required and must be a non-negative number');
  }

  if (!segment.speaker || !['provider', 'patient', 'unknown'].includes(segment.speaker)) {
    errors.push('Speaker must be one of: provider, patient, unknown');
  }

  if (!segment.text || typeof segment.text !== 'string' || segment.text.trim() === '') {
    errors.push('Text is required and must be a non-empty string');
  }

  if (segment.confidence !== undefined && (typeof segment.confidence !== 'number' || segment.confidence < 0 || segment.confidence > 1)) {
    errors.push('Confidence must be a number between 0 and 1');
  }

  return errors;
};

export const validateClinicalDocumentation = (doc: Partial<ClinicalDocumentation>): string[] => {
  const errors: string[] = [];

  if (!doc.soapNote) {
    errors.push('SOAP note is required');
  } else {
    const soapErrors = validateSOAPNote(doc.soapNote);
    soapErrors.forEach(error => errors.push(`SOAP note: ${error}`));
  }

  if (!doc.clinicalEntities || !Array.isArray(doc.clinicalEntities)) {
    errors.push('Clinical entities must be an array');
  } else {
    doc.clinicalEntities.forEach((entity, index) => {
      const entityErrors = validateClinicalEntity(entity);
      entityErrors.forEach(error => errors.push(`Clinical entity ${index}: ${error}`));
    });
  }

  if (!doc.lastUpdated || !(doc.lastUpdated instanceof Date)) {
    errors.push('Last updated date is required and must be a valid Date');
  }

  if (typeof doc.isFinalized !== 'boolean') {
    errors.push('isFinalized must be a boolean');
  }

  return errors;
};

export const validateSOAPNote = (soap: Partial<SOAPNote>): string[] => {
  const errors: string[] = [];

  if (!soap.subjective) {
    errors.push('Subjective section is required');
  }

  if (!soap.objective) {
    errors.push('Objective section is required');
  }

  if (!soap.assessment) {
    errors.push('Assessment section is required');
  } else if (!Array.isArray(soap.assessment.diagnoses)) {
    errors.push('Assessment diagnoses must be an array');
  }

  if (!soap.plan) {
    errors.push('Plan section is required');
  } else if (soap.plan.medications) {
    soap.plan.medications.forEach((med, index) => {
      const medErrors = validateMedication(med);
      medErrors.forEach(error => errors.push(`Medication ${index}: ${error}`));
    });
  }

  return errors;
};

export const validateVitalSigns = (vitals: Partial<VitalSigns>): string[] => {
  const errors: string[] = [];

  if (vitals.heartRate !== undefined && (typeof vitals.heartRate !== 'number' || vitals.heartRate <= 0)) {
    errors.push('Heart rate must be a positive number');
  }

  if (vitals.temperature !== undefined && (typeof vitals.temperature !== 'number' || vitals.temperature < 90 || vitals.temperature > 110)) {
    errors.push('Temperature must be a number between 90 and 110 degrees');
  }

  if (vitals.respiratoryRate !== undefined && (typeof vitals.respiratoryRate !== 'number' || vitals.respiratoryRate <= 0)) {
    errors.push('Respiratory rate must be a positive number');
  }

  if (vitals.oxygenSaturation !== undefined && (typeof vitals.oxygenSaturation !== 'number' || vitals.oxygenSaturation < 0 || vitals.oxygenSaturation > 100)) {
    errors.push('Oxygen saturation must be a number between 0 and 100');
  }

  return errors;
};

export const validateMedication = (med: Partial<Medication>): string[] => {
  const errors: string[] = [];

  if (!med.name || typeof med.name !== 'string' || med.name.trim() === '') {
    errors.push('Medication name is required and must be a non-empty string');
  }

  return errors;
};

export const validateClinicalEntity = (entity: Partial<ClinicalEntity>): string[] => {
  const errors: string[] = [];

  if (!entity.type || !['medication', 'diagnosis', 'symptom', 'procedure', 'allergy'].includes(entity.type)) {
    errors.push('Entity type must be one of: medication, diagnosis, symptom, procedure, allergy');
  }

  if (!entity.value || typeof entity.value !== 'string' || entity.value.trim() === '') {
    errors.push('Entity value is required and must be a non-empty string');
  }

  if (typeof entity.confidence !== 'number' || entity.confidence < 0 || entity.confidence > 1) {
    errors.push('Confidence must be a number between 0 and 1');
  }

  return errors;
};

export const validatePatientContext = (context: Partial<PatientContext>): string[] => {
  const errors: string[] = [];

  if (context.identifier !== undefined && (typeof context.identifier !== 'string' || context.identifier.trim() === '')) {
    errors.push('Patient identifier must be a non-empty string if provided');
  }

  if (context.visitType !== undefined && (typeof context.visitType !== 'string' || context.visitType.trim() === '')) {
    errors.push('Visit type must be a non-empty string if provided');
  }

  return errors;
};

export const validateSessionMetadata = (metadata: Partial<SessionMetadata>): string[] => {
  const errors: string[] = [];

  if (typeof metadata.duration !== 'number' || metadata.duration < 0) {
    errors.push('Duration must be a non-negative number');
  }

  if (metadata.processingStatus && !['pending', 'processing', 'completed', 'error'].includes(metadata.processingStatus)) {
    errors.push('Processing status must be one of: pending, processing, completed, error');
  }

  return errors;
};

// Utility function to check if a session is valid
export const isValidSession = (session: Partial<Session>): boolean => {
  return validateSession(session).length === 0;
};

// Utility function to check if required fields are present for session creation
export const hasRequiredSessionFields = (session: Partial<Session>): boolean => {
  return !!(session.id && session.createdAt && session.updatedAt && session.status);
};