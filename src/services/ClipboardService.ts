import { Session } from "../models/types";
import { exportService } from "./ExportService";

export interface ClipboardOptions {
  format?: "plain" | "html" | "json";
  includeMetadata?: boolean;
  includeTranscript?: boolean;
  includeDocumentation?: boolean;
}

export class ClipboardService {
  /**
   * Check if clipboard API is available
   */
  isSupported(): boolean {
    return "clipboard" in navigator && "writeText" in navigator.clipboard;
  }

  /**
   * Copy session data to clipboard
   */
  async copySession(
    session: Session,
    options: ClipboardOptions = {}
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Clipboard API is not supported in this browser");
    }

    const defaultOptions: ClipboardOptions = {
      format: "plain",
      includeMetadata: true,
      includeTranscript: true,
      includeDocumentation: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      let content: string;

      switch (mergedOptions.format) {
        case "json":
          content = await this.formatSessionAsJSON(session, mergedOptions);
          break;
        case "html":
          content = await this.formatSessionAsHTML(session, mergedOptions);
          break;
        case "plain":
        default:
          content = await this.formatSessionAsText(session, mergedOptions);
          break;
      }

      if (mergedOptions.format === "html") {
        await this.copyHTML(content);
      } else {
        await navigator.clipboard.writeText(content);
      }
    } catch (error) {
      throw new Error(`Failed to copy session to clipboard: ${error}`);
    }
  }

  /**
   * Copy SOAP note to clipboard
   */
  async copySOAPNote(
    session: Session,
    format: "plain" | "html" = "plain"
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Clipboard API is not supported in this browser");
    }

    const soap = session.documentation.soapNote;
    let content: string;

    if (format === "html") {
      content = this.formatSOAPAsHTML(soap);
      await this.copyHTML(content);
    } else {
      content = this.formatSOAPAsText(soap);
      await navigator.clipboard.writeText(content);
    }
  }

  /**
   * Copy transcript to clipboard
   */
  async copyTranscript(
    session: Session,
    format: "plain" | "html" = "plain"
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Clipboard API is not supported in this browser");
    }

    let content: string;

    if (format === "html") {
      content = this.formatTranscriptAsHTML(session.transcript);
      await this.copyHTML(content);
    } else {
      content = this.formatTranscriptAsText(session.transcript);
      await navigator.clipboard.writeText(content);
    }
  }

  /**
   * Copy clinical entities to clipboard
   */
  async copyClinicalEntities(
    session: Session,
    format: "plain" | "html" | "json" = "plain"
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Clipboard API is not supported in this browser");
    }

    const entities = session.documentation.clinicalEntities;
    if (!entities) {
      throw new Error("No clinical entities found in session");
    }

    let content: string;

    switch (format) {
      case "json":
        content = JSON.stringify(entities, null, 2);
        break;
      case "html":
        content = this.formatEntitiesAsHTML(entities);
        await this.copyHTML(content);
        return;
      case "plain":
      default:
        content = this.formatEntitiesAsText(entities);
        break;
    }

    await navigator.clipboard.writeText(content);
  }

  /**
   * Copy specific section text
   */
  async copyText(text: string): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Clipboard API is not supported in this browser");
    }

    await navigator.clipboard.writeText(text);
  }

  /**
   * Copy formatted JSON
   */
  async copyJSON(data: any): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Clipboard API is not supported in this browser");
    }

    const formattedJSON = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(formattedJSON);
  }

  /**
   * Copy HTML content with fallback to plain text
   */
  private async copyHTML(htmlContent: string): Promise<void> {
    try {
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([htmlContent], { type: "text/html" }),
        "text/plain": new Blob([this.stripHTML(htmlContent)], {
          type: "text/plain",
        }),
      });
      await navigator.clipboard.write([clipboardItem]);
    } catch (error) {
      // Fallback to plain text if HTML copying fails
      const plainText = this.stripHTML(htmlContent);
      await navigator.clipboard.writeText(plainText);
    }
  }

  /**
   * Format session as JSON
   */
  private async formatSessionAsJSON(
    session: Session,
    options: ClipboardOptions
  ): Promise<string> {
    const exportResult = await exportService.exportSession(session, "json", {
      includeMetadata: options.includeMetadata,
      includeTranscript: options.includeTranscript,
      includeDocumentation: options.includeDocumentation,
    });

    return await exportResult.blob.text();
  }

  /**
   * Format session as plain text
   */
  private async formatSessionAsText(
    session: Session,
    options: ClipboardOptions
  ): Promise<string> {
    const exportResult = await exportService.exportSession(session, "text", {
      includeMetadata: options.includeMetadata,
      includeTranscript: options.includeTranscript,
      includeDocumentation: options.includeDocumentation,
    });

    return await exportResult.blob.text();
  }

  /**
   * Format session as HTML
   */
  private async formatSessionAsHTML(
    session: Session,
    options: ClipboardOptions
  ): Promise<string> {
    // Use a simplified HTML format for clipboard
    const soap = session.documentation.soapNote;
    let html = "<div>";

    if (options.includeMetadata) {
      html += `
        <h3>Session Information</h3>
        <ul>
          <li><strong>Session ID:</strong> ${session.id}</li>
          <li><strong>Date:</strong> ${session.createdAt.toLocaleString()}</li>
          <li><strong>Status:</strong> ${session.status}</li>
        </ul>
      `;
    }

    if (options.includeDocumentation) {
      html += "<h3>SOAP Note</h3>";
      html += this.formatSOAPAsHTML(soap);
    }

    if (options.includeTranscript && session.transcript.length > 0) {
      html += "<h3>Transcript</h3>";
      html += this.formatTranscriptAsHTML(session.transcript);
    }

    html += "</div>";
    return html;
  }

  /**
   * Format SOAP note as HTML
   */
  private formatSOAPAsHTML(soap: any): string {
    let html = "<div>";

    if (
      soap.subjective.chiefComplaint ||
      soap.subjective.historyOfPresentIllness
    ) {
      html += "<h4>SUBJECTIVE</h4><ul>";
      if (soap.subjective.chiefComplaint) {
        html += `<li><strong>Chief Complaint:</strong> ${soap.subjective.chiefComplaint}</li>`;
      }
      if (soap.subjective.historyOfPresentIllness) {
        html += `<li><strong>History of Present Illness:</strong> ${soap.subjective.historyOfPresentIllness}</li>`;
      }
      html += "</ul>";
    }

    if (soap.objective.physicalExam || soap.objective.vitalSigns) {
      html += "<h4>OBJECTIVE</h4><ul>";
      if (soap.objective.physicalExam) {
        html += `<li><strong>Physical Exam:</strong> ${soap.objective.physicalExam}</li>`;
      }
      html += "</ul>";
    }

    if (soap.assessment.diagnoses.length > 0) {
      html += "<h4>ASSESSMENT</h4><ol>";
      soap.assessment.diagnoses.forEach((diagnosis: string) => {
        html += `<li>${diagnosis}</li>`;
      });
      html += "</ol>";
    }

    if (soap.plan.medications || soap.plan.procedures || soap.plan.followUp) {
      html += "<h4>PLAN</h4>";
      if (soap.plan.medications && soap.plan.medications.length > 0) {
        html += "<p><strong>Medications:</strong></p><ul>";
        soap.plan.medications.forEach((med: any) => {
          html += `<li>${med.name}${med.dosage ? ` ${med.dosage}` : ""}${
            med.frequency ? ` ${med.frequency}` : ""
          }</li>`;
        });
        html += "</ul>";
      }
    }

    html += "</div>";
    return html;
  }

  /**
   * Format SOAP note as plain text
   */
  private formatSOAPAsText(soap: any): string {
    const lines: string[] = [];

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
      lines.push("");
    }

    if (soap.objective.physicalExam || soap.objective.vitalSigns) {
      lines.push("OBJECTIVE:");
      if (soap.objective.physicalExam) {
        lines.push(`Physical Exam: ${soap.objective.physicalExam}`);
      }
      lines.push("");
    }

    if (soap.assessment.diagnoses.length > 0) {
      lines.push("ASSESSMENT:");
      soap.assessment.diagnoses.forEach((diagnosis: string, index: number) => {
        lines.push(`${index + 1}. ${diagnosis}`);
      });
      lines.push("");
    }

    if (soap.plan.medications || soap.plan.procedures || soap.plan.followUp) {
      lines.push("PLAN:");
      if (soap.plan.medications && soap.plan.medications.length > 0) {
        lines.push("Medications:");
        soap.plan.medications.forEach((med: any) => {
          lines.push(
            `- ${med.name}${med.dosage ? ` ${med.dosage}` : ""}${
              med.frequency ? ` ${med.frequency}` : ""
            }`
          );
        });
      }
    }

    return lines.join("\n");
  }

  /**
   * Format transcript as HTML
   */
  private formatTranscriptAsHTML(transcript: any[]): string {
    let html = '<div style="font-family: monospace;">';
    transcript.forEach((segment) => {
      const timestamp =
        Math.floor(segment.timestamp / 60)
          .toString()
          .padStart(2, "0") +
        ":" +
        Math.floor(segment.timestamp % 60)
          .toString()
          .padStart(2, "0");
      html += `<div><strong>[${timestamp}] ${segment.speaker.toUpperCase()}:</strong> ${
        segment.text
      }</div>`;
    });
    html += "</div>";
    return html;
  }

  /**
   * Format transcript as plain text
   */
  private formatTranscriptAsText(transcript: any[]): string {
    const lines: string[] = [];
    transcript.forEach((segment) => {
      const timestamp =
        Math.floor(segment.timestamp / 60)
          .toString()
          .padStart(2, "0") +
        ":" +
        Math.floor(segment.timestamp % 60)
          .toString()
          .padStart(2, "0");
      lines.push(
        `[${timestamp}] ${segment.speaker.toUpperCase()}: ${segment.text}`
      );
    });
    return lines.join("\n");
  }

  /**
   * Format clinical entities as HTML
   */
  private formatEntitiesAsHTML(entities: any): string {
    let html = "<div>";

    if (entities.medications && entities.medications.length > 0) {
      html += "<h4>Medications</h4><ul>";
      entities.medications.forEach((med: string) => {
        html += `<li>${med}</li>`;
      });
      html += "</ul>";
    }

    if (entities.diagnoses && entities.diagnoses.length > 0) {
      html += "<h4>Diagnoses</h4><ul>";
      entities.diagnoses.forEach((diagnosis: string) => {
        html += `<li>${diagnosis}</li>`;
      });
      html += "</ul>";
    }

    html += "</div>";
    return html;
  }

  /**
   * Format clinical entities as plain text
   */
  private formatEntitiesAsText(entities: any): string {
    const lines: string[] = [];

    if (entities.medications && entities.medications.length > 0) {
      lines.push("MEDICATIONS:");
      entities.medications.forEach((med: string) => {
        lines.push(`- ${med}`);
      });
      lines.push("");
    }

    if (entities.diagnoses && entities.diagnoses.length > 0) {
      lines.push("DIAGNOSES:");
      entities.diagnoses.forEach((diagnosis: string) => {
        lines.push(`- ${diagnosis}`);
      });
    }

    return lines.join("\n");
  }

  /**
   * Strip HTML tags from content
   */
  private stripHTML(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }
}

// Export singleton instance
export const clipboardService = new ClipboardService();
