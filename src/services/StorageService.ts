import { Session, SessionFilter, ExportFormat } from "../models/types";
import {
  getDatabase,
  createTransaction,
  handleDatabaseError,
  STORES,
  INDEXES,
} from "./database";
import { validateSession, isValidSession } from "../utils/validation";
import {
  filterSessions,
  searchSessions,
  sortSessions,
  formatSessionForExport,
} from "../utils/transformations";

export interface StorageServiceInterface {
  saveSession(session: Session): Promise<void>;
  getSession(sessionId: string): Promise<Session | null>;
  getAllSessions(): Promise<Session[]>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  clearAllSessions(): Promise<void>;
  getSessionsByFilter(filter: SessionFilter): Promise<Session[]>;
  searchSessions(query: string): Promise<Session[]>;
  getSessionCount(): Promise<number>;
  getSessionsByStatus(status: Session["status"]): Promise<Session[]>;
  getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]>;
  exportSession(sessionId: string, format: ExportFormat): Promise<Blob>;
  exportMultipleSessions(
    sessionIds: string[],
    format: ExportFormat
  ): Promise<Blob>;
  exportAllSessions(format: ExportFormat): Promise<Blob>;
}

export class StorageService implements StorageServiceInterface {
  /**
   * Save a new session or update an existing one
   */
  async saveSession(session: Session): Promise<void> {
    try {
      // Validate session data before saving
      const validationErrors = validateSession(session);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid session data: ${validationErrors.join(", ")}`);
      }

      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readwrite");
      const store = transaction.objectStore(STORES.SESSIONS);

      // Convert dates to ISO strings for storage
      const sessionToStore = this.prepareSessionForStorage(session);

      return new Promise((resolve, reject) => {
        const request = store.put(sessionToStore);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "saveSession"));
        };

        transaction.onerror = () => {
          reject(
            handleDatabaseError(transaction.error, "saveSession transaction")
          );
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "saveSession");
    }
  }

  /**
   * Retrieve a session by its ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      if (!sessionId || typeof sessionId !== "string") {
        throw new Error("Session ID is required and must be a string");
      }

      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readonly");
      const store = transaction.objectStore(STORES.SESSIONS);

      return new Promise((resolve, reject) => {
        const request = store.get(sessionId);

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve(this.prepareSessionFromStorage(result));
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "getSession"));
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "getSession");
    }
  }

  /**
   * Retrieve all sessions
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readonly");
      const store = transaction.objectStore(STORES.SESSIONS);

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const sessions = request.result.map((session) =>
            this.prepareSessionFromStorage(session)
          );
          resolve(sessions);
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "getAllSessions"));
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "getAllSessions");
    }
  }

  /**
   * Update an existing session with partial data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Session>
  ): Promise<void> {
    try {
      if (!sessionId || typeof sessionId !== "string") {
        throw new Error("Session ID is required and must be a string");
      }

      // Get existing session first
      const existingSession = await this.getSession(sessionId);
      if (!existingSession) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      // Merge updates with existing session
      const updatedSession: Session = {
        ...existingSession,
        ...updates,
        id: sessionId, // Ensure ID cannot be changed
        updatedAt: new Date(), // Always update the timestamp
      };

      // Validate the updated session
      if (!isValidSession(updatedSession)) {
        const errors = validateSession(updatedSession);
        throw new Error(
          `Invalid session data after update: ${errors.join(", ")}`
        );
      }

      await this.saveSession(updatedSession);
    } catch (error) {
      throw handleDatabaseError(error, "updateSession");
    }
  }

  /**
   * Delete a session by its ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      if (!sessionId || typeof sessionId !== "string") {
        throw new Error("Session ID is required and must be a string");
      }

      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readwrite");
      const store = transaction.objectStore(STORES.SESSIONS);

      return new Promise((resolve, reject) => {
        const request = store.delete(sessionId);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "deleteSession"));
        };

        transaction.onerror = () => {
          reject(
            handleDatabaseError(transaction.error, "deleteSession transaction")
          );
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "deleteSession");
    }
  }

  /**
   * Securely delete a session with confirmation and data clearing
   */
  async secureDeleteSession(sessionId: string): Promise<void> {
    try {
      // First get the session to ensure it exists and clear sensitive data
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      // Clear sensitive data from memory before deletion
      this.clearSessionData(session);

      // Delete from database
      await this.deleteSession(sessionId);

      // Clear any cached references
      this.clearSessionFromCache(sessionId);
    } catch (error) {
      throw handleDatabaseError(error, "secureDeleteSession");
    }
  }

  /**
   * Securely delete multiple sessions
   */
  async secureDeleteMultipleSessions(sessionIds: string[]): Promise<void> {
    try {
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        throw new Error("Session IDs array is required and must not be empty");
      }

      const errors: string[] = [];

      for (const sessionId of sessionIds) {
        try {
          await this.secureDeleteSession(sessionId);
        } catch (error) {
          errors.push(`Failed to delete session ${sessionId}: ${error}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(
          `Some sessions could not be deleted: ${errors.join("; ")}`
        );
      }
    } catch (error) {
      throw handleDatabaseError(error, "secureDeleteMultipleSessions");
    }
  }

  /**
   * Clear sensitive data from a session object
   */
  private clearSessionData(session: Session): void {
    // Clear transcript segments
    if (session.transcript && Array.isArray(session.transcript)) {
      session.transcript.forEach((segment) => {
        segment.text = "";
        segment.speaker = "unknown";
      });
    }

    // Clear documentation
    if (session.documentation) {
      // Clear SOAP note sections (they are objects, not strings)
      session.documentation.soapNote.subjective = {
        chiefComplaint: "",
        historyOfPresentIllness: "",
        reviewOfSystems: "",
      };
      session.documentation.soapNote.objective = {
        physicalExam: "",
      };
      session.documentation.soapNote.assessment = {
        diagnoses: [],
      };
      session.documentation.soapNote.plan = {};

      // Clear clinical entities (it's an array, not an object with properties)
      if (session.documentation.clinicalEntities) {
        session.documentation.clinicalEntities.length = 0; // Clear the array
      }
    }

    // Clear metadata
    if (session.patientIdentifier !== undefined) {
      session.patientIdentifier = "";
    }
    if (session.visitType !== undefined) {
      session.visitType = "";
    }
  }

  /**
   * Clear session from any in-memory caches
   */
  private clearSessionFromCache(sessionId: string): void {
    // Clear from session storage if used
    try {
      sessionStorage.removeItem(`session_${sessionId}`);
      sessionStorage.removeItem(`session_cache_${sessionId}`);
    } catch (error) {
      // Ignore storage errors
    }

    // Force garbage collection if available
    if ("gc" in window && typeof (window as any).gc === "function") {
      (window as any).gc();
    }
  }

  /**
   * Delete all sessions (use with caution)
   */
  async clearAllSessions(): Promise<void> {
    try {
      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readwrite");
      const store = transaction.objectStore(STORES.SESSIONS);

      return new Promise((resolve, reject) => {
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "clearAllSessions"));
        };

        transaction.onerror = () => {
          reject(
            handleDatabaseError(
              transaction.error,
              "clearAllSessions transaction"
            )
          );
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "clearAllSessions");
    }
  }

  /**
   * Get sessions filtered by various criteria
   */
  async getSessionsByFilter(filter: SessionFilter): Promise<Session[]> {
    try {
      // For simple filters, use indexes for better performance
      if (filter.status && !filter.dateRange && !filter.patientIdentifier) {
        return await this.getSessionsByStatus(filter.status);
      }

      // For complex filters, get all sessions and filter in memory
      const allSessions = await this.getAllSessions();
      return filterSessions(allSessions, filter);
    } catch (error) {
      throw handleDatabaseError(error, "getSessionsByFilter");
    }
  }

  /**
   * Search sessions by text query
   */
  async searchSessions(query: string): Promise<Session[]> {
    try {
      if (!query || typeof query !== "string") {
        return await this.getAllSessions();
      }

      const allSessions = await this.getAllSessions();
      return searchSessions(allSessions, query);
    } catch (error) {
      throw handleDatabaseError(error, "searchSessions");
    }
  }

  /**
   * Get the total count of sessions
   */
  async getSessionCount(): Promise<number> {
    try {
      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readonly");
      const store = transaction.objectStore(STORES.SESSIONS);

      return new Promise((resolve, reject) => {
        const request = store.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "getSessionCount"));
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "getSessionCount");
    }
  }

  /**
   * Get sessions by status using index for better performance
   */
  async getSessionsByStatus(status: Session["status"]): Promise<Session[]> {
    try {
      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readonly");
      const store = transaction.objectStore(STORES.SESSIONS);
      const index = store.index(INDEXES.SESSIONS.BY_STATUS);

      return new Promise((resolve, reject) => {
        const request = index.getAll(status);

        request.onsuccess = () => {
          const sessions = request.result.map((session) =>
            this.prepareSessionFromStorage(session)
          );
          resolve(sessions);
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "getSessionsByStatus"));
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "getSessionsByStatus");
    }
  }

  /**
   * Get sessions within a date range using index
   */
  async getSessionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Session[]> {
    try {
      if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new Error("Start date and end date must be valid Date objects");
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before end date");
      }

      const db = await getDatabase();
      const transaction = createTransaction(db, STORES.SESSIONS, "readonly");
      const store = transaction.objectStore(STORES.SESSIONS);
      const index = store.index(INDEXES.SESSIONS.BY_CREATED_DATE);

      return new Promise((resolve, reject) => {
        const range = IDBKeyRange.bound(
          startDate.toISOString(),
          endDate.toISOString()
        );
        const request = index.getAll(range);

        request.onsuccess = () => {
          const sessions = request.result.map((session) =>
            this.prepareSessionFromStorage(session)
          );
          resolve(sessions);
        };

        request.onerror = () => {
          reject(handleDatabaseError(request.error, "getSessionsByDateRange"));
        };
      });
    } catch (error) {
      throw handleDatabaseError(error, "getSessionsByDateRange");
    }
  }

  /**
   * Get sessions sorted by a specific criteria
   */
  async getSessionsSorted(
    sortBy: "date" | "duration" | "status" = "date"
  ): Promise<Session[]> {
    try {
      const sessions = await this.getAllSessions();
      return sortSessions(sessions, sortBy);
    } catch (error) {
      throw handleDatabaseError(error, "getSessionsSorted");
    }
  }

  /**
   * Check if a session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      return session !== null;
    } catch (error) {
      throw handleDatabaseError(error, "sessionExists");
    }
  }

  /**
   * Get sessions with pagination support
   */
  async getSessionsPaginated(
    offset: number = 0,
    limit: number = 10,
    sortBy: "date" | "duration" | "status" = "date"
  ): Promise<{ sessions: Session[]; total: number; hasMore: boolean }> {
    try {
      const allSessions = await this.getSessionsSorted(sortBy);
      const total = allSessions.length;
      const sessions = allSessions.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      return { sessions, total, hasMore };
    } catch (error) {
      throw handleDatabaseError(error, "getSessionsPaginated");
    }
  }

  /**
   * Export a single session in the specified format
   */
  async exportSession(sessionId: string, format: ExportFormat): Promise<Blob> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      const exportData = formatSessionForExport(session, format);
      return this.createBlobFromData(exportData, format);
    } catch (error) {
      throw handleDatabaseError(error, "exportSession");
    }
  }

  /**
   * Export multiple sessions in the specified format
   */
  async exportMultipleSessions(
    sessionIds: string[],
    format: ExportFormat
  ): Promise<Blob> {
    try {
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        throw new Error("Session IDs array is required and must not be empty");
      }

      const sessions: Session[] = [];
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      if (sessions.length === 0) {
        throw new Error("No valid sessions found for export");
      }

      const exportData = this.formatMultipleSessionsForExport(sessions, format);
      return this.createBlobFromData(exportData, format);
    } catch (error) {
      throw handleDatabaseError(error, "exportMultipleSessions");
    }
  }

  /**
   * Export all sessions in the specified format
   */
  async exportAllSessions(format: ExportFormat): Promise<Blob> {
    try {
      const sessions = await this.getAllSessions();

      if (sessions.length === 0) {
        throw new Error("No sessions available for export");
      }

      const exportData = this.formatMultipleSessionsForExport(sessions, format);
      return this.createBlobFromData(exportData, format);
    } catch (error) {
      throw handleDatabaseError(error, "exportAllSessions");
    }
  }

  /**
   * Format multiple sessions for export
   */
  private formatMultipleSessionsForExport(
    sessions: Session[],
    format: ExportFormat
  ): string {
    switch (format) {
      case "json":
        return JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            sessionCount: sessions.length,
            sessions: sessions,
          },
          null,
          2
        );

      case "text":
        const lines: string[] = [];
        lines.push("MEDICAL SCRIBE SESSIONS EXPORT");
        lines.push("=".repeat(50));
        lines.push(`Export Date: ${new Date().toLocaleString()}`);
        lines.push(`Total Sessions: ${sessions.length}`);
        lines.push("");

        sessions.forEach((session, index) => {
          lines.push(`SESSION ${index + 1}`);
          lines.push("-".repeat(20));
          lines.push(formatSessionForExport(session, "text"));
          lines.push("");
          lines.push("=".repeat(50));
          lines.push("");
        });

        return lines.join("\n");

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Create a Blob from export data with appropriate MIME type
   */
  private createBlobFromData(data: string, format: ExportFormat): Blob {
    const mimeTypes = {
      json: "application/json",
      text: "text/plain",
      pdf: "application/pdf",
    };

    const mimeType = mimeTypes[format] || "text/plain";
    return new Blob([data], { type: mimeType });
  }

  /**
   * Generate filename for export
   */
  generateExportFilename(
    sessionId?: string,
    format: ExportFormat = "json",
    isMultiple: boolean = false
  ): string {
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const extension = format === "json" ? "json" : "txt";

    if (isMultiple) {
      return `medical-scribe-sessions-${timestamp}.${extension}`;
    } else if (sessionId) {
      return `medical-scribe-session-${sessionId}-${timestamp}.${extension}`;
    } else {
      return `medical-scribe-export-${timestamp}.${extension}`;
    }
  }

  /**
   * Prepare session data for storage (convert dates to strings)
   */
  private prepareSessionForStorage(session: Session): any {
    return {
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      documentation: {
        ...session.documentation,
        lastUpdated: session.documentation.lastUpdated.toISOString(),
      },
    };
  }

  /**
   * Prepare session data from storage (convert strings back to dates)
   */
  private prepareSessionFromStorage(storedSession: any): Session {
    return {
      ...storedSession,
      createdAt: new Date(storedSession.createdAt),
      updatedAt: new Date(storedSession.updatedAt),
      documentation: {
        ...storedSession.documentation,
        lastUpdated: new Date(storedSession.documentation.lastUpdated),
      },
    };
  }
}

// Export a singleton instance
export const storageService = new StorageService();
