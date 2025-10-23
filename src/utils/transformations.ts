import { 
  Session, 
  TranscriptSegment, 
  ClinicalDocumentation, 

  SessionFilter,
  ExportFormat
} from '../models/types';

// Date and time transformation utilities
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatTimestamp = (timestamp: number): string => {
  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString();
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Session transformation utilities
export const createEmptySession = (patientContext?: { identifier?: string; visitType?: string }): Omit<Session, 'id'> => {
  const now = new Date();
  
  return {
    createdAt: now,
    updatedAt: now,
    status: 'completed', // Start as 'completed' so it can be started
    patientContext,
    transcript: [],
    documentation: createEmptyDocumentation(),
    metadata: {
      duration: 0,
      processingStatus: 'pending'
    }
  };
};

export const createEmptyDocumentation = (): ClinicalDocumentation => {
  return {
    soapNote: {
      subjective: {},
      objective: {},
      assessment: { diagnoses: [] },
      plan: {}
    },
    clinicalEntities: [],
    lastUpdated: new Date(),
    isFinalized: false
  };
};

export const createTranscriptSegment = (
  text: string, 
  speaker: 'provider' | 'patient' | 'unknown', 
  timestamp: number,
  confidence?: number
): TranscriptSegment => {
  return {
    id: generateSegmentId(),
    timestamp,
    speaker,
    text: text.trim(),
    confidence
  };
};

// ID generation utilities
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateSegmentId = (): string => {
  return `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Data serialization utilities
export const serializeSession = (session: Session): string => {
  return JSON.stringify({
    ...session,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    documentation: {
      ...session.documentation,
      lastUpdated: session.documentation.lastUpdated.toISOString()
    }
  });
};

export const deserializeSession = (data: string): Session => {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
    documentation: {
      ...parsed.documentation,
      lastUpdated: new Date(parsed.documentation.lastUpdated)
    }
  };
};

// Session filtering utilities
export const filterSessions = (sessions: Session[], filter: SessionFilter): Session[] => {
  return sessions.filter(session => {
    // Filter by status
    if (filter.status && session.status !== filter.status) {
      return false;
    }

    // Filter by date range
    if (filter.dateRange) {
      const sessionDate = session.createdAt;
      if (sessionDate < filter.dateRange.start || sessionDate > filter.dateRange.end) {
        return false;
      }
    }

    // Filter by patient identifier
    if (filter.patientIdentifier && 
        (!session.patientContext?.identifier || 
         !session.patientContext.identifier.toLowerCase().includes(filter.patientIdentifier.toLowerCase()))) {
      return false;
    }

    return true;
  });
};

// Search utilities
export const searchSessions = (sessions: Session[], query: string): Session[] => {
  if (!query.trim()) {
    return sessions;
  }

  const searchTerm = query.toLowerCase();
  
  return sessions.filter(session => {
    // Search in patient context
    if (session.patientContext?.identifier?.toLowerCase().includes(searchTerm) ||
        session.patientContext?.visitType?.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in transcript
    if (session.transcript.some(segment => 
        segment.text.toLowerCase().includes(searchTerm))) {
      return true;
    }

    // Search in documentation
    const doc = session.documentation.soapNote;
    if (doc.subjective.chiefComplaint?.toLowerCase().includes(searchTerm) ||
        doc.subjective.historyOfPresentIllness?.toLowerCase().includes(searchTerm) ||
        doc.objective.physicalExam?.toLowerCase().includes(searchTerm) ||
        doc.assessment.diagnoses.some(d => d.toLowerCase().includes(searchTerm)) ||
        doc.plan.followUp?.toLowerCase().includes(searchTerm) ||
        doc.plan.patientInstructions?.toLowerCase().includes(searchTerm)) {
      return true;
    }

    return false;
  });
};

// Sorting utilities
export const sortSessions = (sessions: Session[], sortBy: 'date' | 'duration' | 'status'): Session[] => {
  return [...sessions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.createdAt.getTime() - a.createdAt.getTime(); // Most recent first
      case 'duration':
        return b.metadata.duration - a.metadata.duration; // Longest first
      case 'status':
        const statusOrder = { 'active': 0, 'paused': 1, 'completed': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return 0;
    }
  });
};

// Export format utilities
export const formatSessionForExport = (session: Session, format: ExportFormat): string => {
  switch (format) {
    case 'json':
      return serializeSession(session);
    
    case 'text':
      return formatSessionAsText(session);
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

const formatSessionAsText = (session: Session): string => {
  const lines: string[] = [];
  
  lines.push('MEDICAL SCRIBE SESSION REPORT');
  lines.push('=' .repeat(40));
  lines.push('');
  lines.push(`Session ID: ${session.id}`);
  lines.push(`Date: ${formatDate(session.createdAt)}`);
  lines.push(`Duration: ${formatDuration(session.metadata.duration)}`);
  lines.push(`Status: ${session.status.toUpperCase()}`);
  
  if (session.patientContext?.visitType) {
    lines.push(`Visit Type: ${session.patientContext.visitType}`);
  }
  
  lines.push('');
  lines.push('SOAP NOTE');
  lines.push('-'.repeat(20));
  
  const soap = session.documentation.soapNote;
  
  if (soap.subjective.chiefComplaint) {
    lines.push('');
    lines.push('SUBJECTIVE:');
    lines.push(`Chief Complaint: ${soap.subjective.chiefComplaint}`);
    
    if (soap.subjective.historyOfPresentIllness) {
      lines.push(`History of Present Illness: ${soap.subjective.historyOfPresentIllness}`);
    }
  }
  
  if (soap.objective.physicalExam || soap.objective.vitalSigns) {
    lines.push('');
    lines.push('OBJECTIVE:');
    
    if (soap.objective.vitalSigns) {
      const vitals = soap.objective.vitalSigns;
      lines.push('Vital Signs:');
      if (vitals.bloodPressure) lines.push(`  BP: ${vitals.bloodPressure}`);
      if (vitals.heartRate) lines.push(`  HR: ${vitals.heartRate} bpm`);
      if (vitals.temperature) lines.push(`  Temp: ${vitals.temperature}°F`);
      if (vitals.respiratoryRate) lines.push(`  RR: ${vitals.respiratoryRate}`);
      if (vitals.oxygenSaturation) lines.push(`  O2 Sat: ${vitals.oxygenSaturation}%`);
    }
    
    if (soap.objective.physicalExam) {
      lines.push(`Physical Exam: ${soap.objective.physicalExam}`);
    }
  }
  
  if (soap.assessment.diagnoses.length > 0) {
    lines.push('');
    lines.push('ASSESSMENT:');
    soap.assessment.diagnoses.forEach((diagnosis, index) => {
      lines.push(`${index + 1}. ${diagnosis}`);
    });
  }
  
  if (soap.plan.medications || soap.plan.procedures || soap.plan.followUp) {
    lines.push('');
    lines.push('PLAN:');
    
    if (soap.plan.medications && soap.plan.medications.length > 0) {
      lines.push('Medications:');
      soap.plan.medications.forEach(med => {
        let medLine = `  - ${med.name}`;
        if (med.dosage) medLine += ` ${med.dosage}`;
        if (med.frequency) medLine += ` ${med.frequency}`;
        if (med.route) medLine += ` (${med.route})`;
        lines.push(medLine);
      });
    }
    
    if (soap.plan.procedures && soap.plan.procedures.length > 0) {
      lines.push('Procedures:');
      soap.plan.procedures.forEach(proc => lines.push(`  - ${proc}`));
    }
    
    if (soap.plan.followUp) {
      lines.push(`Follow-up: ${soap.plan.followUp}`);
    }
    
    if (soap.plan.patientInstructions) {
      lines.push(`Patient Instructions: ${soap.plan.patientInstructions}`);
    }
  }
  
  return lines.join('\n');
};

// Utility to calculate session statistics
export const calculateSessionStats = (sessions: Session[]) => {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const totalDuration = sessions.reduce((sum, s) => sum + s.metadata.duration, 0);
  const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  
  return {
    totalSessions,
    completedSessions,
    totalDuration,
    averageDuration,
    completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
  };
};