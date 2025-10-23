import { Session, ExportFormat } from '../models/types';
import { formatDate, formatDuration } from "../utils/transformations";

export interface ExportOptions {
  includeTranscript?: boolean;
  includeDocumentation?: boolean;
  includeMetadata?: boolean;
  dateFormat?: 'short' | 'long' | 'iso';
  template?: 'standard' | 'minimal' | 'detailed';
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

export class ExportService {
  /**
   * Export a single session with custom options
   */
  async exportSession(
    session: Session,
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const defaultOptions: ExportOptions = {
      includeTranscript: true,
      includeDocumentation: true,
      includeMetadata: true,
      dateFormat: "long",
      template: "standard",
    };

    const mergedOptions = { ...defaultOptions, ...options };

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case "json":
        content = this.exportAsJSON(session, mergedOptions);
        mimeType = "application/json";
        extension = "json";
        break;

      case "text":
        content = this.exportAsText(session, mergedOptions);
        mimeType = "text/plain";
        extension = "txt";
        break;

      case "pdf":
        content = await this.exportAsPDF(session, mergedOptions);
        mimeType = "application/pdf";
        extension = "pdf";
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const filename = this.generateFilename(session, extension);

    return { blob, filename, mimeType };
  }

  /**
   * Export multiple sessions
   */
  async exportMultipleSessions(
    sessions: Session[],
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    if (sessions.length === 0) {
      throw new Error("No sessions provided for export");
    }

    const defaultOptions: ExportOptions = {
      includeTranscript: true,
      includeDocumentation: true,
      includeMetadata: true,
      dateFormat: "long",
      template: "standard",
    };

    const mergedOptions = { ...defaultOptions, ...options };

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case "json":
        content = this.exportMultipleAsJSON(sessions, mergedOptions);
        mimeType = "application/json";
        extension = "json";
        break;

      case "text":
        content = this.exportMultipleAsText(sessions, mergedOptions);
        mimeType = "text/plain";
        extension = "txt";
        break;

      case "pdf":
        content = await this.exportMultipleAsPDF(sessions, mergedOptions);
        mimeType = "application/pdf";
        extension = "pdf";
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const filename = this.generateMultipleFilename(sessions.length, extension);

    return { blob, filename, mimeType };
  }

  /**
   * Export session as JSON with filtering options
   */
  private exportAsJSON(session: Session, options: ExportOptions): string {
    const exportData: any = {
      exportDate: new Date().toISOString(),
      exportOptions: options,
      session: this.filterSessionData(session, options),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export session as formatted text
   */
  private exportAsText(session: Session, options: ExportOptions): string {
    const lines: string[] = [];

    // Header
    lines.push("MEDICAL SCRIBE SESSION REPORT");
    lines.push("=".repeat(50));
    lines.push("");

    // Metadata
    if (options.includeMetadata) {
      lines.push(`Session ID: ${session.id}`);
      lines.push(
        `Date: ${this.formatDateByOption(
          session.createdAt,
          options.dateFormat
        )}`
      );
      lines.push(`Duration: ${formatDuration(session.metadata.duration)}`);
      lines.push(`Status: ${session.status.toUpperCase()}`);

      if (session.patientContext?.visitType) {
        lines.push(`Visit Type: ${session.patientContext.visitType}`);
      }

      if (session.patientContext?.identifier) {
        lines.push(`Patient ID: ${session.patientContext.identifier}`);
      }

      lines.push("");
    }

    // Documentation
    if (options.includeDocumentation) {
      lines.push(...this.formatSOAPNoteAsText(session));
    }

    // Transcript
    if (options.includeTranscript && session.transcript.length > 0) {
      lines.push("");
      lines.push("CONVERSATION TRANSCRIPT");
      lines.push("-".repeat(30));
      lines.push("");

      session.transcript.forEach((segment) => {
        const timestamp =
          Math.floor(segment.timestamp / 60)
            .toString()
            .padStart(2, "0") +
          ":" +
          Math.floor(segment.timestamp % 60)
            .toString()
            .padStart(2, "0");
        const speaker = segment.speaker.toUpperCase().padEnd(8);
        lines.push(`[${timestamp}] ${speaker}: ${segment.text}`);
      });
    }

    return lines.join("\n");
  }

  /**
   * Export session as PDF using HTML to PDF conversion
   */
  private async exportAsPDF(
    session: Session,
    options: ExportOptions
  ): Promise<string> {
    // Generate HTML content for PDF
    const htmlContent = this.generatePDFHTML(session, options);

    // Use browser's print functionality to generate PDF
    // This is a more practical approach than requiring external libraries
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Unable to open print window for PDF generation");
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // For now, return the HTML content as a string
    // In a real implementation, you might use libraries like:
    // - jsPDF for client-side PDF generation
    // - Puppeteer for server-side PDF generation
    // - html2pdf.js for HTML to PDF conversion

    return htmlContent;
  }

  /**
   * Generate HTML content for PDF export
   */
  private generatePDFHTML(session: Session, options: ExportOptions): string {
    const soap = session.documentation.soapNote;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Medical Scribe Session - ${session.id}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
            margin: 1in;
            color: #000;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 18pt;
            font-weight: bold;
        }
        .metadata {
            margin-bottom: 20px;
            border: 1px solid #ccc;
            padding: 10px;
            background-color: #f9f9f9;
        }
        .metadata table {
            width: 100%;
            border-collapse: collapse;
        }
        .metadata td {
            padding: 4px 8px;
            border-bottom: 1px solid #ddd;
        }
        .metadata td:first-child {
            font-weight: bold;
            width: 30%;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 10px;
        }
        .soap-section {
            margin-bottom: 15px;
        }
        .soap-title {
            font-weight: bold;
            font-size: 13pt;
            margin-bottom: 5px;
        }
        .transcript {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background-color: #f5f5f5;
            padding: 10px;
            border: 1px solid #ddd;
        }
        .transcript-line {
            margin-bottom: 3px;
        }
        .timestamp {
            color: #666;
            font-weight: bold;
        }
        .speaker {
            font-weight: bold;
            color: #333;
        }
        ul, ol {
            margin: 5px 0;
            padding-left: 20px;
        }
        @media print {
            body { margin: 0.5in; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Medical Scribe Session Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    ${
      options.includeMetadata
        ? `
    <div class="section">
        <div class="section-title">Session Information</div>
        <div class="metadata">
            <table>
                <tr><td>Session ID:</td><td>${session.id}</td></tr>
                <tr><td>Date:</td><td>${this.formatDateByOption(
                  session.createdAt,
                  options.dateFormat
                )}</td></tr>
                <tr><td>Duration:</td><td>${formatDuration(
                  session.metadata.duration
                )}</td></tr>
                <tr><td>Status:</td><td>${session.status.toUpperCase()}</td></tr>
                ${
                  session.patientContext?.visitType
                    ? `<tr><td>Visit Type:</td><td>${session.patientContext.visitType}</td></tr>`
                    : ""
                }
                ${
                  session.patientContext?.identifier
                    ? `<tr><td>Patient ID:</td><td>${session.patientContext.identifier}</td></tr>`
                    : ""
                }
            </table>
        </div>
    </div>
    `
        : ""
    }

    ${
      options.includeDocumentation
        ? `
    <div class="section">
        <div class="section-title">SOAP Note</div>
        
        ${
          soap.subjective.chiefComplaint ||
          soap.subjective.historyOfPresentIllness
            ? `
        <div class="soap-section">
            <div class="soap-title">SUBJECTIVE</div>
            ${
              soap.subjective.chiefComplaint
                ? `<p><strong>Chief Complaint:</strong> ${soap.subjective.chiefComplaint}</p>`
                : ""
            }
            ${
              soap.subjective.historyOfPresentIllness
                ? `<p><strong>History of Present Illness:</strong> ${soap.subjective.historyOfPresentIllness}</p>`
                : ""
            }
            ${
              soap.subjective.reviewOfSystems
                ? `<p><strong>Review of Systems:</strong> ${soap.subjective.reviewOfSystems}</p>`
                : ""
            }
        </div>
        `
            : ""
        }

        ${
          soap.objective.physicalExam || soap.objective.vitalSigns
            ? `
        <div class="soap-section">
            <div class="soap-title">OBJECTIVE</div>
            ${
              soap.objective.vitalSigns
                ? `
            <p><strong>Vital Signs:</strong></p>
            <ul>
                ${
                  soap.objective.vitalSigns.bloodPressure
                    ? `<li>Blood Pressure: ${soap.objective.vitalSigns.bloodPressure}</li>`
                    : ""
                }
                ${
                  soap.objective.vitalSigns.heartRate
                    ? `<li>Heart Rate: ${soap.objective.vitalSigns.heartRate} bpm</li>`
                    : ""
                }
                ${
                  soap.objective.vitalSigns.temperature
                    ? `<li>Temperature: ${soap.objective.vitalSigns.temperature}°F</li>`
                    : ""
                }
                ${
                  soap.objective.vitalSigns.respiratoryRate
                    ? `<li>Respiratory Rate: ${soap.objective.vitalSigns.respiratoryRate}</li>`
                    : ""
                }
                ${
                  soap.objective.vitalSigns.oxygenSaturation
                    ? `<li>Oxygen Saturation: ${soap.objective.vitalSigns.oxygenSaturation}%</li>`
                    : ""
                }
            </ul>
            `
                : ""
            }
            ${
              soap.objective.physicalExam
                ? `<p><strong>Physical Exam:</strong> ${soap.objective.physicalExam}</p>`
                : ""
            }
        </div>
        `
            : ""
        }

        ${
          soap.assessment.diagnoses.length > 0
            ? `
        <div class="soap-section">
            <div class="soap-title">ASSESSMENT</div>
            <ol>
                ${soap.assessment.diagnoses
                  .map((diagnosis) => `<li>${diagnosis}</li>`)
                  .join("")}
            </ol>
            ${
              soap.assessment.differentialDiagnoses &&
              soap.assessment.differentialDiagnoses.length > 0
                ? `
            <p><strong>Differential Diagnoses:</strong></p>
            <ul>
                ${soap.assessment.differentialDiagnoses
                  .map((diff) => `<li>${diff}</li>`)
                  .join("")}
            </ul>
            `
                : ""
            }
        </div>
        `
            : ""
        }

        ${
          soap.plan.medications || soap.plan.procedures || soap.plan.followUp
            ? `
        <div class="soap-section">
            <div class="soap-title">PLAN</div>
            ${
              soap.plan.medications && soap.plan.medications.length > 0
                ? `
            <p><strong>Medications:</strong></p>
            <ul>
                ${soap.plan.medications
                  .map((med) => {
                    let medText = med.name;
                    if (med.dosage) medText += ` ${med.dosage}`;
                    if (med.frequency) medText += ` ${med.frequency}`;
                    if (med.route) medText += ` (${med.route})`;
                    return `<li>${medText}</li>`;
                  })
                  .join("")}
            </ul>
            `
                : ""
            }
            ${
              soap.plan.procedures && soap.plan.procedures.length > 0
                ? `
            <p><strong>Procedures:</strong></p>
            <ul>
                ${soap.plan.procedures
                  .map((proc) => `<li>${proc}</li>`)
                  .join("")}
            </ul>
            `
                : ""
            }
            ${
              soap.plan.followUp
                ? `<p><strong>Follow-up:</strong> ${soap.plan.followUp}</p>`
                : ""
            }
            ${
              soap.plan.patientInstructions
                ? `<p><strong>Patient Instructions:</strong> ${soap.plan.patientInstructions}</p>`
                : ""
            }
        </div>
        `
            : ""
        }
    </div>
    `
        : ""
    }

    ${
      options.includeTranscript && session.transcript.length > 0
        ? `
    <div class="section">
        <div class="section-title">Conversation Transcript</div>
        <div class="transcript">
            ${session.transcript
              .map((segment) => {
                const timestamp =
                  Math.floor(segment.timestamp / 60)
                    .toString()
                    .padStart(2, "0") +
                  ":" +
                  Math.floor(segment.timestamp % 60)
                    .toString()
                    .padStart(2, "0");
                return `<div class="transcript-line">
                <span class="timestamp">[${timestamp}]</span> 
                <span class="speaker">${segment.speaker.toUpperCase()}:</span> 
                ${segment.text}
              </div>`;
              })
              .join("")}
        </div>
    </div>
    `
        : ""
    }

    <div class="section no-print">
        <p><em>This document was generated by Medical Scribe AI on ${new Date().toLocaleString()}</em></p>
    </div>
</body>
</html>`;
  }

  /**
   * Export multiple sessions as JSON
   */
  private exportMultipleAsJSON(
    sessions: Session[],
    options: ExportOptions
  ): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      exportOptions: options,
      sessionCount: sessions.length,
      sessions: sessions.map((session) =>
        this.filterSessionData(session, options)
      ),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export multiple sessions as text
   */
  private exportMultipleAsText(
    sessions: Session[],
    options: ExportOptions
  ): string {
    const lines: string[] = [];

    lines.push("MEDICAL SCRIBE SESSIONS EXPORT");
    lines.push("=".repeat(50));
    lines.push(`Export Date: ${new Date().toLocaleString()}`);
    lines.push(`Total Sessions: ${sessions.length}`);
    lines.push("");

    sessions.forEach((session, index) => {
      lines.push(`SESSION ${index + 1} OF ${sessions.length}`);
      lines.push("=".repeat(30));
      lines.push("");

      const sessionText = this.exportAsText(session, options);
      lines.push(sessionText);

      if (index < sessions.length - 1) {
        lines.push("");
        lines.push("".repeat(50));
        lines.push("");
      }
    });

    return lines.join("\n");
  }

  /**
   * Export multiple sessions as PDF
   */
  private async exportMultipleAsPDF(
    sessions: Session[],
    options: ExportOptions
  ): Promise<string> {
    const textContent = this.exportMultipleAsText(sessions, options);

    return `%PDF-1.4
% Medical Scribe Sessions Export
% This is a placeholder - implement with jsPDF or similar library

${textContent}`;
  }

  /**
   * Filter session data based on export options
   */
  private filterSessionData(session: Session, options: ExportOptions): any {
    const filtered: any = {
      id: session.id,
      status: session.status,
    };

    if (options.includeMetadata) {
      filtered.createdAt = session.createdAt;
      filtered.updatedAt = session.updatedAt;
      filtered.metadata = session.metadata;
      filtered.patientContext = session.patientContext;
    }

    if (options.includeDocumentation) {
      filtered.documentation = session.documentation;
    }

    if (options.includeTranscript) {
      filtered.transcript = session.transcript;
    }

    return filtered;
  }

  /**
   * Format SOAP note as text
   */
  private formatSOAPNoteAsText(
    session: Session
  ): string[] {
    const lines: string[] = [];
    const soap = session.documentation.soapNote;

    lines.push("SOAP NOTE");
    lines.push("-".repeat(20));
    lines.push("");

    // Subjective
    if (
      soap.subjective.chiefComplaint ||
      soap.subjective.historyOfPresentIllness
    ) {
      lines.push("SUBJECTIVE:");

      if (soap.subjective.chiefComplaint) {
        lines.push(`Chief Complaint: ${soap.subjective.chiefComplaint}`);
      }

      if (soap.subjective.historyOfPresentIllness) {
        lines.push(
          `History of Present Illness: ${soap.subjective.historyOfPresentIllness}`
        );
      }

      if (soap.subjective.reviewOfSystems) {
        lines.push(`Review of Systems: ${soap.subjective.reviewOfSystems}`);
      }

      lines.push("");
    }

    // Objective
    if (soap.objective.physicalExam || soap.objective.vitalSigns) {
      lines.push("OBJECTIVE:");

      if (soap.objective.vitalSigns) {
        const vitals = soap.objective.vitalSigns;
        lines.push("Vital Signs:");
        if (vitals.bloodPressure) lines.push(`  BP: ${vitals.bloodPressure}`);
        if (vitals.heartRate) lines.push(`  HR: ${vitals.heartRate} bpm`);
        if (vitals.temperature) lines.push(`  Temp: ${vitals.temperature}°F`);
        if (vitals.respiratoryRate)
          lines.push(`  RR: ${vitals.respiratoryRate}`);
        if (vitals.oxygenSaturation)
          lines.push(`  O2 Sat: ${vitals.oxygenSaturation}%`);
      }

      if (soap.objective.physicalExam) {
        lines.push(`Physical Exam: ${soap.objective.physicalExam}`);
      }

      lines.push("");
    }

    // Assessment
    if (soap.assessment.diagnoses.length > 0) {
      lines.push("ASSESSMENT:");
      soap.assessment.diagnoses.forEach((diagnosis, index) => {
        lines.push(`${index + 1}. ${diagnosis}`);
      });

      if (
        soap.assessment.differentialDiagnoses &&
        soap.assessment.differentialDiagnoses.length > 0
      ) {
        lines.push("Differential Diagnoses:");
        soap.assessment.differentialDiagnoses.forEach((diff, index) => {
          lines.push(`  ${index + 1}. ${diff}`);
        });
      }

      lines.push("");
    }

    // Plan
    if (soap.plan.medications || soap.plan.procedures || soap.plan.followUp) {
      lines.push("PLAN:");

      if (soap.plan.medications && soap.plan.medications.length > 0) {
        lines.push("Medications:");
        soap.plan.medications.forEach((med) => {
          let medLine = `  - ${med.name}`;
          if (med.dosage) medLine += ` ${med.dosage}`;
          if (med.frequency) medLine += ` ${med.frequency}`;
          if (med.route) medLine += ` (${med.route})`;
          lines.push(medLine);
        });
      }

      if (soap.plan.procedures && soap.plan.procedures.length > 0) {
        lines.push("Procedures:");
        soap.plan.procedures.forEach((proc) => lines.push(`  - ${proc}`));
      }

      if (soap.plan.followUp) {
        lines.push(`Follow-up: ${soap.plan.followUp}`);
      }

      if (soap.plan.patientInstructions) {
        lines.push(`Patient Instructions: ${soap.plan.patientInstructions}`);
      }
    }

    return lines;
  }

  /**
   * Format date based on options
   */
  private formatDateByOption(date: Date, format?: string): string {
    switch (format) {
      case "short":
        return date.toLocaleDateString();
      case "iso":
        return date.toISOString();
      case "long":
      default:
        return formatDate(date);
    }
  }

  /**
   * Generate filename for single session export
   */
  private generateFilename(session: Session, extension: string): string {
    const timestamp = new Date().toISOString().split("T")[0];
    const sessionDate = session.createdAt.toISOString().split("T")[0];
    return `medical-scribe-${session.id}-${sessionDate}-exported-${timestamp}.${extension}`;
  }

  /**
   * Generate filename for multiple sessions export
   */
  private generateMultipleFilename(count: number, extension: string): string {
    const timestamp = new Date().toISOString().split("T")[0];
    return `medical-scribe-${count}-sessions-${timestamp}.${extension}`;
  }

  /**
   * Create download link and trigger download
   */
  downloadExport(exportResult: ExportResult): void {
    const url = URL.createObjectURL(exportResult.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy export content to clipboard (for text formats)
   */
  async copyToClipboard(exportResult: ExportResult): Promise<void> {
    if (
      exportResult.mimeType.startsWith("text/") ||
      exportResult.mimeType === "application/json"
    ) {
      const text = await exportResult.blob.text();
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error("Cannot copy binary content to clipboard");
    }
  }
}

// Export singleton instance
export const exportService = new ExportService();
