/**
 * Utility functions for downloading session data
 */

import { Session } from '../models/types';

/**
 * Download transcript as text file
 */
export function downloadTranscriptAsText(session: Session): void {
  console.log('📥 Downloading transcript as text...');
  
  // Format transcript
  let content = `Medical Transcription\n`;
  content += `Session ID: ${session.id}\n`;
  content += `Date: ${session.createdAt.toLocaleString()}\n`;
  content += `Duration: ${Math.floor(session.metadata.duration / 60)}:${(session.metadata.duration % 60).toString().padStart(2, '0')}\n`;
  
  if (session.patientContext) {
    content += `\nPatient Information:\n`;
    if (session.patientContext.identifier) {
      content += `ID: ${session.patientContext.identifier}\n`;
    }
    if (session.patientContext.visitType) {
      content += `Visit Type: ${session.patientContext.visitType}\n`;
    }
  }
  
  content += `\n${'='.repeat(60)}\n`;
  content += `TRANSCRIPT\n`;
  content += `${'='.repeat(60)}\n\n`;
  
  // Add transcript segments
  if (session.transcript && session.transcript.length > 0) {
    session.transcript.forEach((segment) => {
      const timestamp = new Date(segment.timestamp * 1000).toISOString().substr(11, 8);
      content += `[${timestamp}] ${segment.speaker.toUpperCase()}: ${segment.text}\n\n`;
    });
  } else {
    content += 'No transcript available.\n';
  }
  
  // Add documentation if available
  if (session.documentation) {
    content += `\n${'='.repeat(60)}\n`;
    content += `CLINICAL DOCUMENTATION\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    const doc = session.documentation;
    
    if (doc.soapNote) {
      content += `SOAP NOTE\n\n`;
      
      if (doc.soapNote.subjective.chiefComplaint) {
        content += `Chief Complaint: ${doc.soapNote.subjective.chiefComplaint}\n\n`;
      }
      
      if (doc.soapNote.subjective.historyOfPresentIllness) {
        content += `History of Present Illness:\n${doc.soapNote.subjective.historyOfPresentIllness}\n\n`;
      }
      
      if (doc.soapNote.objective.physicalExam) {
        content += `Physical Exam:\n${doc.soapNote.objective.physicalExam}\n\n`;
      }
      
      if (doc.soapNote.assessment.diagnoses.length > 0) {
        content += `Assessment:\n`;
        doc.soapNote.assessment.diagnoses.forEach((diagnosis, i) => {
          content += `${i + 1}. ${diagnosis}\n`;
        });
        content += `\n`;
      }
      
      if (doc.soapNote.plan.medications && doc.soapNote.plan.medications.length > 0) {
        content += `Medications:\n`;
        doc.soapNote.plan.medications.forEach((med) => {
          content += `- ${med.name}`;
          if (med.dosage) content += ` ${med.dosage}`;
          if (med.frequency) content += ` ${med.frequency}`;
          content += `\n`;
        });
        content += `\n`;
      }
    }
  }
  
  // Create and download file
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transcript-${session.id}-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('✅ Transcript downloaded');
}

/**
 * Download audio recording
 */
export async function downloadAudio(session: Session, audioBlob: Blob): Promise<void> {
  console.log('📥 Downloading audio...');
  
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error('No audio available to download');
  }
  
  const url = URL.createObjectURL(audioBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `recording-${session.id}-${Date.now()}.webm`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('✅ Audio downloaded');
}

/**
 * Download both transcript and audio as a ZIP
 */
export async function downloadSessionPackage(session: Session, audioBlob?: Blob): Promise<void> {
  console.log('📦 Preparing session package...');
  
  // For now, download separately
  // In the future, could use JSZip to create a proper ZIP file
  downloadTranscriptAsText(session);
  
  if (audioBlob && audioBlob.size > 0) {
    await downloadAudio(session, audioBlob);
  }
  
  console.log('✅ Session package downloaded');
}
