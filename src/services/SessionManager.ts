import {
  Session,
  TranscriptSegment,
  PatientContext,
  SessionFilter,
} from "../models/types";
import { StorageService } from "./StorageService";
import { RecordingController } from "./RecordingController";
import { TranscriptionServiceManager } from "./TranscriptionServiceManager";
import { DocumentationGenerator } from "./DocumentationGenerator";
import {
  createEmptySession,
  generateSessionId,
} from "../utils/transformations";
import { validateSession } from "../utils/validation";

/**
 * Interface defining the contract for session management operations.
 *
 * The SessionManager is responsible for orchestrating the complete lifecycle
 * of medical transcription sessions, coordinating between recording, transcription,
 * and documentation services.
 *
 * @interface SessionManagerInterface
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const sessionManager = new SessionManager(config);
 *
 * // Create and start a new session
 * const session = await sessionManager.createSession({
 *   identifier: 'PATIENT-123',
 *   visitType: 'consultation'
 * });
 *
 * await sessionManager.startSession(session.id);
 * ```
 */
export interface SessionManagerInterface {
  /**
   * Creates a new medical transcription session.
   *
   * @param patientContext - Optional patient information and visit context
   * @returns Promise resolving to the created session
   *
   * @throws {ValidationError} When patient context is invalid
   * @throws {StorageError} When session cannot be persisted
   *
   * @example
   * ```typescript
   * const session = await sessionManager.createSession({
   *   identifier: 'PATIENT-123',
   *   visitType: 'follow-up',
   *   department: 'cardiology'
   * });
   * ```
   */
  createSession(patientContext?: PatientContext): Promise<Session>;

  /**
   * Starts recording and transcription for an existing session.
   *
   * @param sessionId - Unique identifier of the session to start
   * @returns Promise that resolves when session is successfully started
   *
   * @throws {SessionNotFoundError} When session ID doesn't exist
   * @throws {SessionStateError} When session is not in a startable state
   * @throws {RecordingError} When audio recording cannot be initiated
   *
   * @example
   * ```typescript
   * await sessionManager.startSession('session-123');
   * ```
   */
  startSession(sessionId: string): Promise<void>;

  /**
   * Pauses an active recording session while preserving state.
   *
   * @param sessionId - Unique identifier of the session to pause
   * @returns Promise that resolves when session is successfully paused
   *
   * @throws {SessionNotFoundError} When session ID doesn't exist
   * @throws {SessionStateError} When session is not currently active
   *
   * @example
   * ```typescript
   * await sessionManager.pauseSession('session-123');
   * ```
   */
  pauseSession(sessionId: string): Promise<void>;

  /**
   * Resumes a previously paused session.
   *
   * @param sessionId - Unique identifier of the session to resume
   * @returns Promise that resolves when session is successfully resumed
   *
   * @throws {SessionNotFoundError} When session ID doesn't exist
   * @throws {SessionStateError} When session is not currently paused
   *
   * @example
   * ```typescript
   * await sessionManager.resumeSession('session-123');
   * ```
   */
  resumeSession(sessionId: string): Promise<void>;

  /**
   * Stops an active session and finalizes all recordings.
   *
   * @param sessionId - Unique identifier of the session to stop
   * @returns Promise that resolves when session is successfully stopped
   *
   * @throws {SessionNotFoundError} When session ID doesn't exist
   * @throws {SessionStateError} When session is not currently active or paused
   *
   * @example
   * ```typescript
   * await sessionManager.stopSession('session-123');
   * ```
   */
  stopSession(sessionId: string): Promise<void>;

  /**
   * Retrieves a session by its unique identifier.
   *
   * @param sessionId - Unique identifier of the session to retrieve
   * @returns Promise resolving to the session or null if not found
   *
   * @example
   * ```typescript
   * const session = await sessionManager.getSession('session-123');
   * if (session) {
   *   console.log('Session status:', session.status);
   * }
   * ```
   */
  getSession(sessionId: string): Promise<Session>;

  /**
   * Lists sessions with optional filtering criteria.
   *
   * @param filter - Optional filter criteria for sessions
   * @returns Promise resolving to array of matching sessions
   *
   * @example
   * ```typescript
   * // Get all completed sessions from last week
   * const sessions = await sessionManager.listSessions({
   *   status: 'completed',
   *   dateRange: {
   *     start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
   *     end: new Date()
   *   }
   * });
   * ```
   */
  listSessions(filter?: SessionFilter): Promise<Session[]>;

  /**
   * Searches sessions using text query with optional filtering.
   *
   * Performs full-text search across session transcripts, documentation,
   * and metadata to find relevant sessions.
   *
   * @param query - Text query to search for
   * @param filter - Optional additional filter criteria
   * @returns Promise resolving to array of matching sessions
   *
   * @example
   * ```typescript
   * // Search for sessions mentioning "hypertension"
   * const sessions = await sessionManager.searchSessions('hypertension', {
   *   visitType: 'consultation'
   * });
   * ```
   */
  searchSessions(query: string, filter?: SessionFilter): Promise<Session[]>;

  /**
   * Retrieves sessions with pagination, sorting, and filtering support.
   *
   * @param options - Pagination and filtering options
   * @returns Promise resolving to paginated result with metadata
   *
   * @example
   * ```typescript
   * const result = await sessionManager.getSessionsWithPagination({
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'date',
   *   sortOrder: 'desc',
   *   searchQuery: 'diabetes'
   * });
   *
   * console.log(`Found ${result.totalCount} sessions`);
   * console.log(`Page ${result.currentPage} of ${result.totalPages}`);
   * ```
   */
  getSessionsWithPagination(
    options: PaginationOptions
  ): Promise<PaginatedResult<Session>>;

  /**
   * Permanently deletes a session and all associated data.
   *
   * @param sessionId - Unique identifier of the session to delete
   * @returns Promise that resolves when session is successfully deleted
   *
   * @throws {SessionNotFoundError} When session ID doesn't exist
   * @throws {SessionStateError} When session is currently active
   *
   * @warning This operation is irreversible and will permanently delete
   * all transcripts, documentation, and audio data.
   *
   * @example
   * ```typescript
   * await sessionManager.deleteSession('session-123');
   * ```
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Updates the documentation for an existing session.
   *
   * @param sessionId - Unique identifier of the session to update
   * @param documentation - Partial documentation updates to apply
   * @returns Promise that resolves when documentation is successfully updated
   *
   * @throws {SessionNotFoundError} When session ID doesn't exist
   * @throws {ValidationError} When documentation updates are invalid
   *
   * @example
   * ```typescript
   * await sessionManager.updateDocumentation('session-123', {
   *   soapNote: {
   *     subjective: {
   *       chiefComplaint: 'Updated chief complaint'
   *     }
   *   }
   * });
   * ```
   */
  updateDocumentation(
    sessionId: string,
    documentation: Partial<Session["documentation"]>
  ): Promise<void>;

  /**
   * Finalizes a session, marking it as complete and ready for review.
   *
   * @param sessionId - Unique identifier of the session to finalize
   * @returns Promise that resolves when session is successfully finalized
   *
   * @throws {SessionNotFoundError} When session ID doesn't exist
   * @throws {SessionStateError} When session cannot be finalized
   *
   * @example
   * ```typescript
   * await sessionManager.finalizeSession('session-123');
   * ```
   */
  finalizeSession(sessionId: string): Promise<void>;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: "date" | "duration" | "status" | "patientId";
  sortOrder?: "asc" | "desc";
  filter?: SessionFilter;
  searchQuery?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SessionManagerConfig {
  autoSaveInterval?: number;
  enableRealTimeTranscription?: boolean;
  enableRealTimeDocumentation?: boolean;
  transcriptionConfig?: any;
  documentationConfig?: any;
}

export class SessionManager implements SessionManagerInterface {
  private storageService: StorageService;
  private recordingController: RecordingController;
  private transcriptionManager: TranscriptionServiceManager;
  private documentationGenerator: DocumentationGenerator;

  private activeSession: Session | null = null;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private chunkTranscriptionTimer: ReturnType<typeof setInterval> | null = null;
  private lastTranscribedAudioSize: number = 0; // Track what we've already transcribed
  private config: Required<SessionManagerConfig> = {
    autoSaveInterval: 5000, // 5 seconds
    enableRealTimeTranscription: true,
    enableRealTimeDocumentation: true,
    transcriptionConfig: {},
    documentationConfig: {},
  };

  // Event callbacks
  private sessionUpdateCallbacks: ((session: Session) => void)[] = [];
  private transcriptUpdateCallbacks: ((segment: TranscriptSegment) => void)[] =
    [];
  private documentationUpdateCallbacks: ((
    documentation: Session["documentation"]
  ) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  constructor(
    storageService: StorageService,
    recordingController: RecordingController,
    transcriptionManager: TranscriptionServiceManager,
    documentationGenerator: DocumentationGenerator,
    config?: Partial<SessionManagerConfig>
  ) {
    this.storageService = storageService;
    this.recordingController = recordingController;
    this.transcriptionManager = transcriptionManager;
    this.documentationGenerator = documentationGenerator;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.setupEventListeners();
  }

  /**
   * Create a new session
   */
  async createSession(patientContext?: PatientContext): Promise<Session> {
    try {
      const sessionId = generateSessionId();
      const sessionData = createEmptySession(patientContext);

      const session: Session = {
        id: sessionId,
        ...sessionData,
      };

      // Validate session before saving
      const validationErrors = validateSession(session);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid session data: ${validationErrors.join(", ")}`);
      }

      await this.storageService.saveSession(session);

      this.notifySessionUpdate(session);

      return session;
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to create session")
      );
      throw error;
    }
  }

  /**
   * Start a session (begin recording and transcription)
   */
  async startSession(sessionId: string): Promise<void> {
    console.log('🚀 SessionManager.startSession() called for:', sessionId);
    
    try {
      // Get session from storage
      const session = await this.storageService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      console.log('📋 Session loaded:', { id: session.id, status: session.status });

      // Allow restarting if session is not currently recording
      // Only prevent if there's already an active recording in progress
      if (session.status === "active" && this.activeSession?.id === sessionId) {
        console.warn("Session is already active, skipping start");
        return; // Just return instead of throwing error
      }

      // Set as active session
      this.activeSession = session;

      // Update session status
      session.status = "active";
      session.updatedAt = new Date();
      await this.storageService.updateSession(sessionId, {
        status: "active",
        updatedAt: session.updatedAt,
      });

      // Start recording
      console.log('🎙️ Starting recording controller...');
      await this.recordingController.startRecording();
      console.log('✅ Recording controller started');

      // Start real-time transcription if enabled
      console.log('🔍 Real-time transcription enabled:', this.config.enableRealTimeTranscription);
      if (this.config.enableRealTimeTranscription) {
        try {
          await this.transcriptionManager.startRealtimeTranscription(
            this.handleNewTranscriptSegment.bind(this)
          );
        } catch (transcriptionError) {
          // Log but don't fail - recording can work without transcription
          console.warn(
            "Real-time transcription not available:",
            transcriptionError
          );
          // Disable it for this session
          this.config.enableRealTimeTranscription = false;
        }
      }

      // Reset transcription tracking
      this.lastTranscribedAudioSize = 0;

      // Start auto-save timer
      console.log('💾 Starting auto-save...');
      this.startAutoSave();

      // Start chunked transcription timer (every 15 seconds)
      console.log('📝 About to start chunked transcription...');
      this.startChunkedTranscription();
      console.log('✅ Chunked transcription started');

      console.log('📢 Notifying session update...');
      this.notifySessionUpdate(session);
      console.log('✅ Session started successfully');
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to start session")
      );
      throw error;
    }
  }

  /**
   * Pause a session
   */
  async pauseSession(sessionId: string): Promise<void> {
    try {
      if (!this.activeSession || this.activeSession.id !== sessionId) {
        throw new Error("Session is not currently active");
      }

      // Pause recording
      await this.recordingController.pauseRecording();

      // Update session status
      this.activeSession.status = "paused";
      this.activeSession.updatedAt = new Date();
      await this.storageService.updateSession(sessionId, {
        status: "paused",
        updatedAt: this.activeSession.updatedAt,
      });

      // Stop auto-save timer
      this.stopAutoSave();

      // Stop chunked transcription
      this.stopChunkedTranscription();

      this.notifySessionUpdate(this.activeSession);
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to pause session")
      );
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<void> {
    try {
      if (!this.activeSession || this.activeSession.id !== sessionId) {
        throw new Error("Session is not currently active");
      }

      if (this.activeSession.status !== "paused") {
        throw new Error("Session is not paused");
      }

      // Resume recording
      await this.recordingController.resumeRecording();

      // Update session status
      this.activeSession.status = "active";
      this.activeSession.updatedAt = new Date();
      await this.storageService.updateSession(sessionId, {
        status: "active",
        updatedAt: this.activeSession.updatedAt,
      });

      // Restart auto-save timer
      this.startAutoSave();

      // Restart chunked transcription
      this.startChunkedTranscription();

      this.notifySessionUpdate(this.activeSession);
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to resume session")
      );
      throw error;
    }
  }

  /**
   * Stop a session
   */
  async stopSession(sessionId: string): Promise<void> {
    try {
      if (!this.activeSession || this.activeSession.id !== sessionId) {
        throw new Error("Session is not currently active");
      }

      // Stop recording and get final audio
      const audioBlob = await this.recordingController.stopRecording();

      // Stop real-time transcription
      if (this.config.enableRealTimeTranscription) {
        await this.transcriptionManager.stopRealtimeTranscription();
      }

      // Process final audio with Gemini for high-quality transcription
      // This runs even if real-time transcription was active (Web Speech)
      // to get better quality results from Gemini
      if (audioBlob && audioBlob.size > 0) {
        try {
          console.log('🎯 Processing final audio with Gemini...');
          const transcriptionResult =
            await this.transcriptionManager.transcribe(audioBlob);
          
          // If we had real-time transcription, replace it with Gemini's better results
          // Otherwise, add the new transcription
          if (transcriptionResult.segments.length > 0) {
            console.log(`✅ Gemini transcribed ${transcriptionResult.segments.length} segment(s)`);
            this.activeSession.transcript = transcriptionResult.segments;
          }
        } catch (error) {
          console.warn("Failed to transcribe final audio:", error);
          // Keep any real-time transcription we already have
        }
      }

      // Generate final documentation
      if (this.activeSession.transcript.length > 0) {
        try {
          const docResult =
            await this.documentationGenerator.generateDocumentation(
              this.activeSession.transcript
            );
          this.activeSession.documentation = docResult.documentation;
        } catch (error) {
          console.warn("Failed to generate final documentation:", error);
        }
      }

      // Update session status and metadata
      const recordingState = this.recordingController.getState();
      this.activeSession.status = "completed";
      this.activeSession.updatedAt = new Date();
      this.activeSession.metadata.duration = recordingState.duration;
      this.activeSession.metadata.processingStatus = "completed";

      // Save final session state
      await this.storageService.saveSession(this.activeSession);

      // Stop auto-save timer
      this.stopAutoSave();

      // Stop chunked transcription
      this.stopChunkedTranscription();

      this.notifySessionUpdate(this.activeSession);

      // Clear active session
      this.activeSession = null;
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to stop session")
      );
      throw error;
    }
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    try {
      const session = await this.storageService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      return session;
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to get session")
      );
      throw error;
    }
  }

  /**
   * List sessions with optional filtering
   */
  async listSessions(filter?: SessionFilter): Promise<Session[]> {
    try {
      if (filter) {
        return await this.storageService.getSessionsByFilter(filter);
      } else {
        return await this.storageService.getAllSessions();
      }
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to list sessions")
      );
      throw error;
    }
  }

  /**
   * Search sessions with text query and optional filtering
   */
  async searchSessions(
    query: string,
    filter?: SessionFilter
  ): Promise<Session[]> {
    try {
      // Get all sessions that match the filter first
      let sessions: Session[];
      if (filter) {
        sessions = await this.storageService.getSessionsByFilter(filter);
      } else {
        sessions = await this.storageService.getAllSessions();
      }

      // If no query, return filtered sessions
      if (!query.trim()) {
        return sessions;
      }

      // Perform text search across session content
      return this.performTextSearch(sessions, query.trim().toLowerCase());
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to search sessions")
      );
      throw error;
    }
  }

  /**
   * Get sessions with pagination, sorting, and filtering
   */
  async getSessionsWithPagination(
    options: PaginationOptions
  ): Promise<PaginatedResult<Session>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "date",
        sortOrder = "desc",
        filter,
        searchQuery,
      } = options;

      // Get sessions with search and filter
      let sessions: Session[];
      if (searchQuery) {
        sessions = await this.searchSessions(searchQuery, filter);
      } else {
        sessions = await this.listSessions(filter);
      }

      // Sort sessions
      sessions = this.sortSessions(sessions, sortBy, sortOrder);

      // Calculate pagination
      const totalCount = sessions.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const items = sessions.slice(startIndex, endIndex);

      return {
        items,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.handleError(
        error instanceof Error
          ? error
          : new Error("Failed to get paginated sessions")
      );
      throw error;
    }
  }

  /**
   * Perform text search across session content
   */
  private performTextSearch(sessions: Session[], query: string): Session[] {
    const searchTerms = query.split(/\s+/).filter((term) => term.length > 0);

    return sessions.filter((session) => {
      const searchableContent =
        this.getSearchableContent(session).toLowerCase();

      // Check if all search terms are found in the content
      return searchTerms.every((term) => searchableContent.includes(term));
    });
  }

  /**
   * Extract searchable content from a session
   */
  private getSearchableContent(session: Session): string {
    const content: string[] = [];

    // Session metadata
    content.push(session.id);
    if (session.patientContext?.identifier) {
      content.push(session.patientContext.identifier);
    }
    if (session.patientContext?.visitType) {
      content.push(session.patientContext.visitType);
    }
    content.push(session.status);

    // Transcript content
    if (session.transcript && session.transcript.length > 0) {
      session.transcript.forEach((segment) => {
        content.push(segment.text);
        content.push(segment.speaker);
      });
    }

    // Documentation content
    const doc = session.documentation;
    if (doc) {
      // SOAP note content
      const soap = doc.soapNote;
      if (soap.subjective.chiefComplaint)
        content.push(soap.subjective.chiefComplaint);
      if (soap.subjective.historyOfPresentIllness)
        content.push(soap.subjective.historyOfPresentIllness);
      if (soap.subjective.reviewOfSystems)
        content.push(soap.subjective.reviewOfSystems);
      if (soap.objective.physicalExam)
        content.push(soap.objective.physicalExam);

      // Vital signs
      if (soap.objective.vitalSigns) {
        const vitals = soap.objective.vitalSigns;
        if (vitals.bloodPressure) content.push(vitals.bloodPressure);
        if (vitals.heartRate) content.push(vitals.heartRate.toString());
        if (vitals.temperature) content.push(vitals.temperature.toString());
        if (vitals.respiratoryRate)
          content.push(vitals.respiratoryRate.toString());
        if (vitals.oxygenSaturation)
          content.push(vitals.oxygenSaturation.toString());
      }

      // Diagnoses
      soap.assessment.diagnoses.forEach((diagnosis) => content.push(diagnosis));
      if (soap.assessment.differentialDiagnoses) {
        soap.assessment.differentialDiagnoses.forEach((diff) =>
          content.push(diff)
        );
      }

      // Plan content
      if (soap.plan.medications) {
        soap.plan.medications.forEach((med) => {
          content.push(med.name);
          if (med.dosage) content.push(med.dosage);
          if (med.frequency) content.push(med.frequency);
          if (med.route) content.push(med.route);
        });
      }
      if (soap.plan.procedures) {
        soap.plan.procedures.forEach((proc) => content.push(proc));
      }
      if (soap.plan.followUp) content.push(soap.plan.followUp);
      if (soap.plan.patientInstructions)
        content.push(soap.plan.patientInstructions);

      // Clinical entities
      if (doc.clinicalEntities && Array.isArray(doc.clinicalEntities)) {
        const entities = doc.clinicalEntities;
        entities.forEach((entity) => {
          if (entity.value) {
            content.push(entity.value);
          }
        });
      }
    }

    return content.join(" ");
  }

  /**
   * Sort sessions by specified criteria
   */
  private sortSessions(
    sessions: Session[],
    sortBy: string,
    sortOrder: "asc" | "desc"
  ): Session[] {
    const sorted = [...sessions].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "duration":
          comparison =
            (a.metadata?.duration || 0) - (b.metadata?.duration || 0);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "patientId":
          const aPatient = a.patientContext?.identifier || "";
          const bPatient = b.patientContext?.identifier || "";
          comparison = aPatient.localeCompare(bPatient);
          break;
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return sorted;
  }

  /**
   * Get search suggestions based on existing session content
   */
  async getSearchSuggestions(limit: number = 10): Promise<string[]> {
    try {
      const sessions = await this.storageService.getAllSessions();
      const suggestions = new Set<string>();

      sessions.forEach((session) => {
        // Add common medical terms from documentation
        const doc = session.documentation;
        if (doc) {
          // Add diagnoses
          doc.soapNote.assessment.diagnoses.forEach((diagnosis) => {
            if (diagnosis.length > 3) suggestions.add(diagnosis);
          });

          // Add medications
          if (doc.soapNote.plan.medications) {
            doc.soapNote.plan.medications.forEach((med) => {
              if (med.name.length > 3) suggestions.add(med.name);
            });
          }

          // Add clinical entities
          if (doc.clinicalEntities && Array.isArray(doc.clinicalEntities)) {
            const entities = doc.clinicalEntities;
            entities.forEach((entity) => {
              if (
                entity.type === "symptom" &&
                entity.value &&
                entity.value.length > 3
              ) {
                suggestions.add(entity.value);
              }
            });
          }
        }

        // Add visit types
        if (session.patientContext?.visitType) {
          suggestions.add(session.patientContext.visitType);
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      this.handleError(
        error instanceof Error
          ? error
          : new Error("Failed to get search suggestions")
      );
      return [];
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Don't allow deleting active session
      if (this.activeSession && this.activeSession.id === sessionId) {
        throw new Error("Cannot delete active session");
      }

      await this.storageService.deleteSession(sessionId);
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to delete session")
      );
      throw error;
    }
  }

  /**
   * Update session documentation
   */
  async updateDocumentation(
    sessionId: string,
    documentation: Partial<Session["documentation"]>
  ): Promise<void> {
    try {
      const session = await this.storageService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const updatedDocumentation = {
        ...session.documentation,
        ...documentation,
        lastUpdated: new Date(),
      };

      await this.storageService.updateSession(sessionId, {
        documentation: updatedDocumentation,
        updatedAt: new Date(),
      });

      // Update active session if it matches
      if (this.activeSession && this.activeSession.id === sessionId) {
        this.activeSession.documentation = updatedDocumentation;
        this.notifyDocumentationUpdate(updatedDocumentation);
      }
    } catch (error) {
      this.handleError(
        error instanceof Error
          ? error
          : new Error("Failed to update documentation")
      );
      throw error;
    }
  }

  /**
   * Finalize a session (mark as complete and finalized)
   */
  async finalizeSession(sessionId: string): Promise<void> {
    try {
      const session = await this.storageService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (session.status === "active") {
        throw new Error(
          "Cannot finalize active session. Stop the session first."
        );
      }

      const updates = {
        status: "completed" as const,
        documentation: {
          ...session.documentation,
          isFinalized: true,
          lastUpdated: new Date(),
        },
        updatedAt: new Date(),
      };

      await this.storageService.updateSession(sessionId, updates);
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error("Failed to finalize session")
      );
      throw error;
    }
  }

  /**
   * Get current active session
   */
  getActiveSession(): Session | null {
    return this.activeSession ? { ...this.activeSession } : null;
  }

  /**
   * Check if there's an active session
   */
  hasActiveSession(): boolean {
    return this.activeSession !== null;
  }

  /**
   * Get recording state
   */
  getRecordingState() {
    return this.recordingController.getState();
  }

  /**
   * Event listener registration methods
   */
  onSessionUpdate(callback: (session: Session) => void): void {
    this.sessionUpdateCallbacks.push(callback);
  }

  onTranscriptUpdate(callback: (segment: TranscriptSegment) => void): void {
    this.transcriptUpdateCallbacks.push(callback);
  }

  onDocumentationUpdate(
    callback: (documentation: Session["documentation"]) => void
  ): void {
    this.documentationUpdateCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Handle new transcript segment from real-time transcription
   */
  private async handleNewTranscriptSegment(
    segment: TranscriptSegment
  ): Promise<void> {
    if (!this.activeSession) return;

    try {
      // Add segment to active session
      this.activeSession.transcript.push(segment);
      this.activeSession.updatedAt = new Date();

      // Update documentation if enabled
      if (this.config.enableRealTimeDocumentation) {
        try {
          const updatedDoc =
            await this.documentationGenerator.updateDocumentation(
              this.activeSession.documentation,
              [segment]
            );
          this.activeSession.documentation = updatedDoc;
          this.notifyDocumentationUpdate(updatedDoc);
        } catch (error) {
          console.warn("Failed to update documentation in real-time:", error);
        }
      }

      // Notify callbacks
      this.notifyTranscriptUpdate(segment);
      this.notifySessionUpdate(this.activeSession);
    } catch (error) {
      this.handleError(
        error instanceof Error
          ? error
          : new Error("Failed to handle transcript segment")
      );
    }
  }

  /**
   * Setup event listeners for services
   */
  private setupEventListeners(): void {
    // Recording controller events
    this.recordingController.onError((error) => {
      this.handleError(error);
    });

    this.recordingController.onStateChange((state) => {
      if (this.activeSession) {
        this.activeSession.metadata.duration = state.duration;
        this.notifySessionUpdate(this.activeSession);
      }
    });
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    this.stopAutoSave(); // Clear existing timer

    this.autoSaveTimer = setInterval(async () => {
      if (this.activeSession) {
        try {
          await this.storageService.saveSession(this.activeSession);
        } catch (error) {
          console.warn("Auto-save failed:", error);
        }
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Start chunked transcription (every 15 seconds)
   */
  private startChunkedTranscription(): void {
    console.log('🎬 startChunkedTranscription() method called');
    
    try {
      this.stopChunkedTranscription(); // Clear existing timer

      console.log('🎬 Starting chunked transcription (every 15 seconds)');
      console.log('🔍 Active session:', this.activeSession?.id);
      console.log('🔍 Recording controller:', !!this.recordingController);

      this.chunkTranscriptionTimer = setInterval(async () => {
        console.log('⏰ Chunked transcription timer fired!');
        console.log('🔍 Active session exists:', !!this.activeSession);
        console.log('🔍 Recording controller exists:', !!this.recordingController);
        
        if (this.activeSession && this.recordingController) {
          try {
            console.log('📦 Getting audio chunk for transcription...');
          
          // Get current audio chunk from recording controller
          const audioChunk = await this.recordingController.getAudioChunk();
          
          // Only transcribe if we have a meaningful amount of new audio
          const dynamicThreshold = Math.max(
            4000,
            Math.round(audioChunk.size * 0.3)
          );
          const newAudioSize = audioChunk.size - this.lastTranscribedAudioSize;
          
          if (audioChunk && audioChunk.size > 0 && newAudioSize >= dynamicThreshold) {
            console.log(`📤 Transcribing ${audioChunk.size} bytes with Gemini (${newAudioSize} bytes new)...`);
            this.lastTranscribedAudioSize = audioChunk.size;
            
            // Transcribe the chunk
            const transcriptionResult = await this.transcriptionManager.transcribe(audioChunk);
            
            console.log('📊 Transcription result:', {
              segmentCount: transcriptionResult.segments.length,
              segments: transcriptionResult.segments.map(s => ({ id: s.id, text: s.text.substring(0, 50) }))
            });

            if (transcriptionResult.segments.length > 0) {
              console.log(`✅ Chunk transcribed: ${transcriptionResult.segments.length} segment(s)`);
              
              // Add segments to active session
              const beforeCount = this.activeSession.transcript.length;
              this.activeSession.transcript.push(...transcriptionResult.segments);
              const afterCount = this.activeSession.transcript.length;
              console.log(`📝 Transcript updated: ${beforeCount} → ${afterCount} segments`);
              
              this.activeSession.updatedAt = new Date();

              try {
                await this.storageService.saveSession(this.activeSession);
              } catch (saveError) {
                console.warn('⚠️ Failed to persist transcript update:', saveError);
              }
              
              // Notify UI of new transcription
              console.log(`📢 Notifying ${this.transcriptUpdateCallbacks.length} transcript callbacks`);
              transcriptionResult.segments.forEach(segment => {
                console.log(`📤 Notifying segment: "${segment.text.substring(0, 50)}..."`);
                this.notifyTranscriptUpdate(segment);
              });
              
              console.log(`📢 Notifying ${this.sessionUpdateCallbacks.length} session callbacks`);
              this.notifySessionUpdate(this.activeSession);
              
              // Update documentation if enabled
              if (this.config.enableRealTimeDocumentation) {
                try {
                  const updatedDoc = await this.documentationGenerator.updateDocumentation(
                    this.activeSession.documentation,
                    transcriptionResult.segments
                  );
                  this.activeSession.documentation = updatedDoc;
                  this.notifyDocumentationUpdate(updatedDoc);
                } catch (error) {
                  console.warn("Failed to update documentation:", error);
                }
              }
            }
          } else if (audioChunk && audioChunk.size > 0) {
            console.log(`⚠️ Audio chunk too small (${newAudioSize} bytes new, need ${dynamicThreshold}), waiting for more audio...`);
          } else {
            console.log('⚠️ No audio chunk available yet');
          }
        } catch (error) {
          console.warn("Chunked transcription failed:", error);
          // Don't stop the timer, just log and continue
        }
      } else {
        console.log('⚠️ Timer fired but no active session or recording controller');
      }
    }, 15000); // Every 15 seconds
    
    console.log('✅ Chunked transcription timer started, timer ID:', this.chunkTranscriptionTimer);
    console.log('⏰ Next chunk transcription will happen in 15 seconds...');
    } catch (error) {
      console.error('❌ Error starting chunked transcription:', error);
      throw error;
    }
  }

  /**
   * Stop chunked transcription timer
   */
  private stopChunkedTranscription(): void {
    if (this.chunkTranscriptionTimer) {
      console.log('🛑 Stopping chunked transcription');
      clearInterval(this.chunkTranscriptionTimer);
      this.chunkTranscriptionTimer = null;
    }
  }

  /**
   * Notification methods
   */
  private notifySessionUpdate(session: Session): void {
    console.log(`📢 notifySessionUpdate called with ${this.sessionUpdateCallbacks.length} callbacks registered`);
    console.log(`📊 Session data:`, {
      id: session.id,
      transcriptLength: session.transcript.length,
      lastSegment: session.transcript[session.transcript.length - 1]
    });
    
    // Create a deep copy to ensure React detects the change
    const sessionCopy: Session = {
      ...session,
      transcript: [...session.transcript],
      documentation: { ...session.documentation }
    };
    
    this.sessionUpdateCallbacks.forEach((callback, index) => {
      try {
        console.log(`📤 Calling session callback #${index + 1}`);
        callback(sessionCopy);
        console.log(`✅ Session callback #${index + 1} completed`);
      } catch (error) {
        console.error(`❌ Error in session update callback #${index + 1}:`, error);
      }
    });
  }

  private notifyTranscriptUpdate(segment: TranscriptSegment): void {
    this.transcriptUpdateCallbacks.forEach((callback) => {
      try {
        callback(segment);
      } catch (error) {
        console.error("Error in transcript update callback:", error);
      }
    });
  }

  private notifyDocumentationUpdate(
    documentation: Session["documentation"]
  ): void {
    this.documentationUpdateCallbacks.forEach((callback) => {
      try {
        callback(documentation);
      } catch (error) {
        console.error("Error in documentation update callback:", error);
      }
    });
  }

  private handleError(error: Error): void {
    console.error("SessionManager error:", error);
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error("Error in error callback:", callbackError);
      }
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SessionManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SessionManagerConfig {
    return { ...this.config };
  }

  /**
   * Dispose of the session manager
   */
  async dispose(): Promise<void> {
    // Stop any active session
    if (this.activeSession) {
      try {
        await this.stopSession(this.activeSession.id);
      } catch (error) {
        console.warn("Error stopping session during disposal:", error);
      }
    }

    // Stop auto-save
    this.stopAutoSave();

    // Clear callbacks
    this.sessionUpdateCallbacks = [];
    this.transcriptUpdateCallbacks = [];
    this.documentationUpdateCallbacks = [];
    this.errorCallbacks = [];

    // Dispose of services
    await this.recordingController.dispose();
    await this.transcriptionManager.dispose();
  }
}
