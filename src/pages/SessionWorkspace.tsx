import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Session } from "../models/types";
import { SessionManager } from "../services/SessionManager";
import { StorageService } from "../services/StorageService";
import { EnhancedRecordingController } from "../services/EnhancedRecordingController";
import { TranscriptionServiceManager } from "../services/TranscriptionServiceManager";
import { DocumentationGenerator } from "../services/DocumentationGenerator";
import { userSettingsService } from "../services/UserSettingsService";
import { getTemplatesBySpecialty, NoteTemplate } from "../models/templates";
import { HeaderBar } from "../components/HeaderBar";
import { TabNavigation, TabType } from "../components/TabNavigation";
import { TasksPanel } from "../components/TasksPanel";
import { AIInputBar } from "../components/AIInputBar";
import { TemplateSelector } from "../components/TemplateSelector";
import { NoteDisplay } from "../components/NoteDisplay";
import { TranscriptView } from "../components/TranscriptView";
import { ContextView } from "../components/ContextView";
import { RecordingButton } from "../components/RecordingButton";
import { useToast } from "../components/Toast";
import { transcriptAnalyzer } from "../services/TranscriptAnalyzer";
import { Task } from "../components/TasksPanel";

// Reuse the RecentSessionsList component from original file
const RecentSessionsList: React.FC<{
  sessionManager: SessionManager;
  onSessionSelect: (id: string) => void;
  refreshTrigger?: number;
}> = ({ sessionManager, onSessionSelect, refreshTrigger }) => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]); // Reload when refreshTrigger changes

  const loadSessions = async () => {
    try {
      const allSessions = await sessionManager.listSessions();
      const sorted = allSessions.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      setSessions(sorted.slice(0, 10));
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const groupedSessions: { [key: string]: Session[] } = {};
  sessions.forEach((session) => {
    const dateKey = formatDate(session.createdAt);
    if (!groupedSessions[dateKey]) {
      groupedSessions[dateKey] = [];
    }
    groupedSessions[dateKey].push(session);
  });

  return (
    <>
      {Object.entries(groupedSessions).map(([date, dateSessions]) => (
        <div key={date}>
          <div className="text-xs text-gray-500 px-2 py-1">{date}</div>
          {dateSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded"
            >
              <div className="text-sm font-medium text-gray-900">
                {session.patientContext?.identifier || "Untitled Session"}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(session.createdAt)}
              </div>
            </button>
          ))}
        </div>
      ))}
    </>
  );
};

export const SessionWorkspace: React.FC = () => {
  const params = useParams<{ sessionId?: string }>();
  const location = useLocation();
  const sessionId =
    params.sessionId ?? (location.pathname.endsWith("/session/new") ? "new" : undefined);
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  // Core state
  const [session, setSession] = useState<Session | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("note");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState("00:00");
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null
  );

  // Patient & Template state
  const [patientDetails, setPatientDetails] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(
    null
  );
  const [availableTemplates, setAvailableTemplates] = useState<NoteTemplate[]>(
    []
  );

  // Note & Content state
  const [generatedNote, setGeneratedNote] = useState<string>("");
  const [generatingNote, setGeneratingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // Vital signs state
  const [vitalSigns, setVitalSigns] = useState<any>({});

  // Session list refresh trigger
  const [sessionListRefresh, setSessionListRefresh] = useState(0);
  const CURRENT_SESSION_KEY = "current_session_id";

  const lastPersistedSessionIdRef = useRef<string | null>(null);
  const lastPersistedTranscriptRef = useRef<string>("");
  const hasAutoCreatedRouteSessionRef = useRef(false);
  const currentViewSessionIdRef = useRef<string | undefined>(sessionId);
  currentViewSessionIdRef.current = sessionId;

  const getCurrentSessionId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(CURRENT_SESSION_KEY);
    } catch {
      return null;
    }
  }, []);

  const setCurrentSessionId = useCallback((id: string | null) => {
    if (typeof window === "undefined") return;
    try {
      if (id) {
        localStorage.setItem(CURRENT_SESSION_KEY, id);
      } else {
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Services
  const [recordingController] = useState(
    () => new EnhancedRecordingController()
  );
  const [sessionManager] = useState(
    () =>
      new SessionManager(
        new StorageService(),
        recordingController,
        new TranscriptionServiceManager(),
        new DocumentationGenerator()
      )
  );

  // Define createNewSession before useEffect so it can be called
  const createNewSession = useCallback(
    async (
      options: { showToast?: boolean; refreshList?: boolean } = {}
    ) => {
      const { showToast: shouldToast = true, refreshList = true } = options;
      console.log("🔨 createNewSession called");

      if (isCreatingSession) {
        console.log("⚠️ Already creating a session, skipping");
        return;
      }

      setIsCreatingSession(true);
      try {
        const newSession = await sessionManager.createSession({
          identifier: "",
          visitType: "consultation",
        });
        console.log("✅ Session created:", newSession.id);
        setSession({
          ...newSession,
          transcript: [...(newSession.transcript ?? [])],
        });
        setCurrentSessionId(newSession.id);
        setPatientDetails("");
        setTasks([]);
        setTasksLoaded(true);
        setVitalSigns({});
        setGeneratedNote("");

        // Load default template for new session
        const defaultTemplateId = userSettingsService.getDefaultTemplate();
        if (defaultTemplateId) {
          const userSpecialty = userSettingsService.getSpecialty();
          const templates = getTemplatesBySpecialty(userSpecialty);
          const defaultTemplate = templates.find(
            (t) => t.id === defaultTemplateId
          );
          if (defaultTemplate) {
            console.log(
              "📋 Setting default template for new session:",
              defaultTemplate.name
            );
            setSelectedTemplate(defaultTemplate);
          }
        }

        // Mark tasks as loaded for new session to enable auto-save
        setTasksLoaded(true);

        navigate(`/session/${newSession.id}`, { replace: true });
        if (refreshList) {
          setSessionListRefresh((prev) => prev + 1);
        }
        if (shouldToast) {
          showToast("New session created", "success");
        }
      } catch (error) {
        console.error("❌ Failed to create session:", error);
        showToast("Failed to create session", "error");
      } finally {
        setIsCreatingSession(false);
      }
    },
    [sessionManager, navigate, showToast, isCreatingSession, setCurrentSessionId]
  );

  const loadSession = useCallback(
    async (id: string, { silentRefresh = false } = {}) => {
      try {
        const loadedSession = await sessionManager.getSession(id);
        setSession({
          ...loadedSession,
          transcript: [...(loadedSession.transcript ?? [])],
        });

        const shouldBeRecording = loadedSession.status === "active";
        setIsRecording(shouldBeRecording);
        if (!shouldBeRecording) {
          setRecordingStartTime(null);
          setDuration("00:00");
        }

        setPatientDetails(loadedSession.patientContext?.identifier || "");
        setGeneratedNote(loadedSession.documentation?.clinicalNote || "");
        setVitalSigns(
          loadedSession.documentation?.soapNote?.objective?.vitalSigns || {}
        );
        setTasks(loadedSession.metadata?.tasks || []);

        setTasksLoaded(true);

        if (!silentRefresh) {
          setSessionListRefresh((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        if (!silentRefresh) {
          showToast("Failed to load session", "error");
        }
      }
    },
    [sessionManager, showToast]
  );

  // Initialize
  useEffect(() => {
    console.log(
      "🔄 Initialize effect triggered, sessionId:",
      sessionId,
      "session:",
      session?.id,
      "isCreatingSession:",
      isCreatingSession
    );

    if (isCreatingSession) {
      console.log("⏳ Session creation in progress, skipping initialization");
      return;
    }

    if (sessionId !== "new") {
      hasAutoCreatedRouteSessionRef.current = false;
    }

    if (sessionId === "new") {
      console.log("🆕 /session/new detected - auto-creating session");
      if (!hasAutoCreatedRouteSessionRef.current && !isCreatingSession) {
        hasAutoCreatedRouteSessionRef.current = true;
        void createNewSession({ showToast: true, refreshList: true });
      }
    } else if (sessionId && session && session.id === sessionId) {
      setCurrentSessionId(sessionId);
      console.log("✅ Session already loaded, skipping initialization");
    } else if (sessionId && sessionId !== "new") {
      console.log("📂 Loading existing session:", sessionId);
      setCurrentSessionId(sessionId);
      loadSession(sessionId, { silentRefresh: true });
    } else {
      const currentId = getCurrentSessionId();

      if (currentId) {
        console.log("🔁 Redirecting to current session:", currentId);
        navigate(`/session/${currentId}`, { replace: true });
      } else {
        console.log("ℹ️ No existing session. Awaiting user to create one.");
        setSession(null);
        setCurrentSessionId(null);
      }
    }

    // Load templates
    const userSpecialty = userSettingsService.getSpecialty();
    const templates = getTemplatesBySpecialty(userSpecialty);
    setAvailableTemplates(templates);
    console.log(
      "📚 Loaded",
      templates.length,
      "templates for specialty:",
      userSpecialty
    );

    // Set default template from user settings
    const defaultTemplateId = userSettingsService.getDefaultTemplate();
    if (defaultTemplateId && !selectedTemplate) {
      const defaultTemplate = templates.find((t) => t.id === defaultTemplateId);
      if (defaultTemplate) {
        console.log(
          "📋 Setting default template from settings:",
          defaultTemplate.name
        );
        setSelectedTemplate(defaultTemplate);
      } else {
        console.warn("⚠️ Saved default template not found:", defaultTemplateId);
      }
    }
  }, [
    sessionId,
    isCreatingSession,
    session,
    loadSession,
    createNewSession,
    getCurrentSessionId,
    setCurrentSessionId,
    navigate,
    selectedTemplate
  ]);

  // Update duration timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setDuration(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
          )}`
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  // Session update listener
  useEffect(() => {
    const handleSessionUpdate = (updatedSession: Session) => {
      setSession({
        ...updatedSession,
        transcript: [...updatedSession.transcript],
      });

      // Sync recording state with session status
      const shouldBeRecording = updatedSession.status === "active";
      if (shouldBeRecording !== isRecording) {
        console.log(
          `Syncing recording state: ${isRecording} -> ${shouldBeRecording}`
        );
        setIsRecording(shouldBeRecording);
        if (!shouldBeRecording) {
          setRecordingStartTime(null);
          setDuration("00:00");
        }
      }
    };

    sessionManager.onSessionUpdate(handleSessionUpdate);
  }, [sessionManager, isRecording]);

  // Save tasks to storage whenever they change
  useEffect(() => {
    const saveTasks = async () => {
      if (!session || !tasksLoaded) return;

      try {
        const storage = new StorageService();
        await storage.updateSession(session.id, {
          metadata: {
            ...session.metadata,
            tasks: tasks,
          },
        });
        console.log('✅ Tasks saved to storage');
      } catch (error) {
        console.error('❌ Failed to save tasks:', error);
      }
    };

    // Only save if we have a session and tasks have been loaded (not initial render)
    if (session && tasksLoaded) {
      saveTasks();
    }
  }, [tasks, session, tasksLoaded]);

  // Persist transcript changes so switching sessions always hydrates latest segments
  useEffect(() => {
    if (!session) {
      lastPersistedSessionIdRef.current = null;
      lastPersistedTranscriptRef.current = "";
      return;
    }

    const segments = session.transcript ?? [];
    const fingerprint =
      segments.length === 0
        ? `${session.id}::empty`
        : segments
            .map(
              (segment) =>
                `${segment.id}:${segment.timestamp}:${segment.speaker}:${segment.text.length}`
            )
            .join("|");

    const sessionChanged =
      session.id !== lastPersistedSessionIdRef.current;

    if (sessionChanged) {
      lastPersistedSessionIdRef.current = session.id;
      lastPersistedTranscriptRef.current = "";
    }

    if (segments.length === 0) {
      lastPersistedTranscriptRef.current = fingerprint;
      return;
    }

    if (fingerprint === lastPersistedTranscriptRef.current) {
      return;
    }

    let cancelled = false;

    const persistTranscript = async () => {
      try {
        const storage = new StorageService();
        await storage.updateSession(session.id, {
          transcript: segments.map((segment) => ({ ...segment })),
        });
        if (!cancelled) {
          lastPersistedTranscriptRef.current = fingerprint;
        }
      } catch (error) {
        console.error("Failed to persist transcript:", error);
      }
    };

    persistTranscript();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleNewSessionClick = async () => {
    await createNewSession({ showToast: true, refreshList: true });
  };

  const handlePatientDetailsChange = async (details: string) => {
    setPatientDetails(details);
    if (!session) return;

    try {
      const storage = new StorageService();
      await storage.updateSession(session.id, {
        patientContext: {
          ...session.patientContext,
          identifier: details,
        },
      });

      // Update local session state
      setSession({
        ...session,
        patientContext: {
          ...session.patientContext,
          identifier: details,
        },
      });

      // Trigger session list refresh
      setSessionListRefresh((prev) => prev + 1);

      showToast("Patient details saved", "success");
    } catch (error) {
      console.error("Failed to save patient details:", error);
      showToast("Failed to save patient details", "error");
    }
  };

  const handleStartRecording = async () => {
    if (!session) return;

    // Check if already recording
    if (isRecording) {
      console.log("Already recording, skipping start");
      return;
    }

    try {
      await sessionManager.startSession(session.id);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      showToast("Recording started", "success");
    } catch (error) {
      console.error("Failed to start recording:", error);
      // Reset state on error
      setIsRecording(false);
      setRecordingStartTime(null);
      showToast("Failed to start recording", "error");
    }
  };

  const handleStopRecording = async () => {
    if (!session) {
      console.error("❌ No session available");
      return;
    }

    const sourceSessionId = session.id;

    // Check if actually recording before trying to stop
    if (!isRecording) {
      console.log("⚠️ Not recording, skipping stop");
      return;
    }

    // Check if session is actually active
    if (session.status !== "active") {
      console.warn("⚠️ Session status is not active:", session.status);
      console.log("🔄 Resetting UI state to match session state");
      setIsRecording(false);
      setRecordingStartTime(null);
      setDuration("00:00");
      showToast("Recording was not active", "warning");
      return;
    }

    try {
      console.log("🛑 Stopping recording for session:", sourceSessionId);
      await sessionManager.stopSession(sourceSessionId);
      setIsRecording(false);
      setRecordingStartTime(null);
      setDuration("00:00");
      showToast("Recording stopped", "success");

      // Reload session to get updated transcript
      console.log("📥 Reloading session to get updated transcript...");
      const updatedSession = await sessionManager.getSession(sourceSessionId);
      console.log(
        "📊 Updated session transcript length:",
        updatedSession.transcript?.length || 0
      );

      if (updatedSession.transcript && updatedSession.transcript.length > 0) {
        console.log(
          "📝 Transcript segments:",
          updatedSession.transcript.map((s) => s.text.substring(0, 50))
        );
      }

      if (currentViewSessionIdRef.current === sourceSessionId) {
        setSession({
          ...updatedSession,
          transcript: [...(updatedSession.transcript ?? [])],
        });
      }

      // Analyze transcript to extract tasks and vital signs, then auto-generate note
      if (updatedSession.transcript && updatedSession.transcript.length > 0) {
        const fullTranscript = updatedSession.transcript
          .map((s) => s.text)
          .join(" ");
        console.log(
          "📄 Full transcript length:",
          fullTranscript.length,
          "characters"
        );

        // First analyze for tasks and vital signs
        if (currentViewSessionIdRef.current === sourceSessionId) {
          showToast("Analyzing transcript...", "info");
        }

        const analysisPromise = analyzeTranscript(
          fullTranscript,
          sourceSessionId
        );

        let notePromise: Promise<void> = Promise.resolve();
        if (
          selectedTemplate &&
          currentViewSessionIdRef.current === sourceSessionId
        ) {
          console.log(
            "📝 Auto-generating note with template:",
            selectedTemplate.name
          );
          showToast("Generating note...", "info");
          notePromise = generateNoteFromTranscript(
            fullTranscript,
            sourceSessionId
          );
        }

        await Promise.all([analysisPromise, notePromise]);
      } else if (currentViewSessionIdRef.current === sourceSessionId) {
        console.warn("⚠️ No transcript found after stopping recording");
        showToast("No transcript was recorded", "warning");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      // Reset state even on error to prevent stuck UI
      setIsRecording(false);
      setRecordingStartTime(null);
      setDuration("00:00");
      showToast("Failed to stop recording", "error");
    }
  };

  const handleUploadAudio = async (file: File) => {
    console.log("🎯 handleUploadAudio called with file:", file);
    console.log("📋 Current session:", session?.id);

    if (!session) {
      console.error("❌ No session available");
      showToast("Please create a session first", "error");
      return;
    }

    try {
      const sourceSessionId = session.id;
      console.log(
        "📤 Processing uploaded audio file:",
        file.name,
        file.type,
        file.size
      );
      if (currentViewSessionIdRef.current === sourceSessionId) {
        showToast("Converting audio format...", "info");
      }

      // Convert audio to WAV format for maximum Gemini compatibility
      const { audioConverter } = await import("../utils/audioConverter");

      let audioBlob: Blob;

      // Check if conversion is needed
      const needsConversion =
        !file.type.includes("wav") && !file.type.includes("mpeg");

      if (needsConversion) {
        console.log("🔄 Converting audio to WAV format...");
        try {
          audioBlob = await audioConverter.convertToWav(file);
          console.log("✅ Audio converted to WAV:", audioBlob.size, "bytes");
          if (currentViewSessionIdRef.current === sourceSessionId) {
            showToast("Audio converted successfully", "success");
          }
        } catch (conversionError) {
          console.warn(
            "⚠️ Conversion failed, using original file:",
            conversionError
          );
          // Fallback to original file if conversion fails
          const arrayBuffer = await file.arrayBuffer();
          audioBlob = new Blob([arrayBuffer], {
            type: file.type || "audio/wav",
          });
        }
      } else {
        console.log(
          "✓ Audio format is already compatible, skipping conversion"
        );
        const arrayBuffer = await file.arrayBuffer();
        audioBlob = new Blob([arrayBuffer], { type: file.type });
      }

      if (currentViewSessionIdRef.current === sourceSessionId) {
        showToast("Transcribing audio...", "info");
      }

      // Use Gemini transcription service directly
      const { GeminiTranscriptionService } = await import(
        "../services/GeminiTranscriptionService"
      );
      const transcriptionService = new GeminiTranscriptionService();

      console.log("🎤 Starting transcription with Gemini...");
      const result = await transcriptionService.transcribe(audioBlob);

      console.log("✅ Transcription result:", result);

      if (result.segments && result.segments.length > 0) {
        console.log(`📝 Got ${result.segments.length} segments`);

        // Update session with transcript
        const updatedSession = {
          ...session,
          transcript: [...session.transcript, ...result.segments],
        };
        if (currentViewSessionIdRef.current === sourceSessionId) {
          setSession(updatedSession);
        }

        // Save to storage
        const storage = new StorageService();
        await storage.updateSession(sourceSessionId, {
          transcript: updatedSession.transcript,
        });

        if (currentViewSessionIdRef.current === sourceSessionId) {
          showToast(`Transcribed ${result.segments.length} segments`, "success");
        }

        // Analyze the transcript and auto-generate note
        const fullTranscript = result.segments.map((s) => s.text).join(" ");
        console.log(
          "🔍 Analyzing transcript:",
          fullTranscript.substring(0, 100) + "..."
        );

        const analysisPromise = analyzeTranscript(
          fullTranscript,
          sourceSessionId
        );

        let notePromise: Promise<void> = Promise.resolve();
        if (
          selectedTemplate &&
          currentViewSessionIdRef.current === sourceSessionId
        ) {
          console.log(
            "📝 Auto-generating note with template:",
            selectedTemplate.name
          );
          showToast("Generating note...", "info");
          notePromise = generateNoteFromTranscript(
            fullTranscript,
            sourceSessionId
          );
        }

        await Promise.all([analysisPromise, notePromise]);
      } else if (currentViewSessionIdRef.current === sourceSessionId) {
        console.warn("⚠️ No segments in transcription result");
        showToast("No speech detected in audio file", "error");
      }
    } catch (error) {
      console.error("❌ Failed to process audio file:", error);

      // Check if it's a Gemini API error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (currentViewSessionIdRef.current === sourceSessionId) {
        if (errorMessage.includes("500") || errorMessage.includes("INTERNAL")) {
          showToast(
            "Gemini API error: This audio format may not be fully supported. Try converting to WAV or MP3 format.",
            "error"
          );
        } else if (errorMessage.includes("400")) {
          showToast(
            "Invalid audio file. Please ensure the file is a valid audio recording.",
            "error"
          );
        } else {
          showToast(`Failed to process audio file: ${errorMessage}`, "error");
        }
      }
    }
  };

  const generateNoteFromTranscript = async (
    transcriptText: string,
    targetSessionId: string
  ) => {
    if (!selectedTemplate) {
      console.warn("⚠️ No template selected for note generation");
      return;
    }

    try {
      const isViewingTarget =
        currentViewSessionIdRef.current === targetSessionId;
      if (isViewingTarget) {
        setGeneratingNote(true);
      }
      console.log("🤖 Generating note using template:", selectedTemplate.name);

      // Create prompt for AI
      const prompt = `You are a medical documentation assistant. Your task is to extract information from the consultation transcript and organize it into a structured medical note.

CRITICAL RULES:
1. ONLY include information that is explicitly mentioned in the transcript
2. DO NOT make up, infer, or hallucinate any medical information
3. If a section has no relevant information in the transcript, write "Not documented" or leave it blank
4. DO NOT add placeholder text, examples, or fictional data
5. Be accurate and conservative - when in doubt, leave it out
6. Use exact quotes or paraphrases from the transcript only

Template: ${selectedTemplate.name}
${selectedTemplate.aiPrompt}

Transcript:
${transcriptText}

Generate a medical note with these sections (only fill in what's actually mentioned):
${selectedTemplate.sections
  .map(
    (s) => `
${s.title}:
${
  s.required
    ? '(Required - extract from transcript if available, otherwise write "Not documented")'
    : "(Optional - only include if mentioned in transcript)"
}
`
  )
  .join("\n")}

Remember: Accuracy over completeness. Only document what was actually said.`;

      console.log("📤 Sending prompt to AI...");

      // Call Gemini API to generate the note
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topP: 0.8,
              topK: 20,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE",
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let generatedText = data.candidates[0].content.parts[0].text;

      // Post-process to remove common hallucination patterns
      generatedText = generatedText
        .replace(/\[.*?\]/g, "")
        .replace(/\(example:.*?\)/gi, "")
        .replace(/\(placeholder.*?\)/gi, "")
        .replace(/e\.g\.,.*?(?=\n|$)/gi, "")
        .trim();

      console.log("✅ Note generated successfully");
      if (isViewingTarget && currentViewSessionIdRef.current === targetSessionId) {
        setGeneratedNote(generatedText);
        showToast("Note generated successfully!", "success");

        // Auto-switch to Note tab to show the generated note
        setActiveTab("note");
      } else {
        console.log(
          "ℹ️ Skipping note UI update because user navigated away from session",
          targetSessionId
        );
      }
    } catch (error) {
      console.error("❌ Failed to generate note:", error);
      if (isViewingTarget && currentViewSessionIdRef.current === targetSessionId) {
        showToast("Failed to generate note", "error");
      }
    } finally {
      if (isViewingTarget) {
        setGeneratingNote(false);
      }
    }
  };

  const analyzeTranscript = async (
    transcriptText: string,
    targetSessionId: string
  ) => {
    try {
      console.log("🔍 Analyzing transcript for tasks and vital signs...");
      const analysis = await transcriptAnalyzer.analyzeTranscript(
        transcriptText
      );
      const storage = new StorageService();
      const targetSession = await storage.getSession(targetSessionId);

      if (!targetSession) {
        console.warn(
          "⚠️ Target session not found while analyzing transcript:",
          targetSessionId
        );
        return;
      }

      const shouldSyncUI =
        currentViewSessionIdRef.current === targetSessionId;

      let documentationUpdate: Session["documentation"] | undefined;
      let metadataUpdate: Session["metadata"] | undefined;
      let newTasks: Task[] | undefined;

      // Update vital signs if found
      if (analysis.vitalSigns && Object.keys(analysis.vitalSigns).length > 0) {
        console.log("✅ Extracted vital signs:", analysis.vitalSigns);
        documentationUpdate = {
          ...targetSession.documentation,
          soapNote: {
            ...targetSession.documentation.soapNote,
            objective: {
              ...targetSession.documentation.soapNote.objective,
              vitalSigns: analysis.vitalSigns,
            },
          },
        };

        if (shouldSyncUI) {
          setVitalSigns(analysis.vitalSigns);
        }
      }

      // Update tasks if found
      if (analysis.tasks && analysis.tasks.length > 0) {
        console.log("✅ Extracted tasks:", analysis.tasks);
        const initialNewTasks = analysis.tasks.map((task, index) => ({
          id: `task-${Date.now()}-${index}`,
          text: task.text,
          completed: false,
          priority: task.priority,
          category: task.category,
          createdAt: new Date(),
        }));
        const existingTasks = Array.isArray(
          targetSession.metadata?.tasks
        )
          ? targetSession.metadata.tasks
          : [];
        const dedupedNewTasks = initialNewTasks.filter(
          (task) =>
            !existingTasks.some(
              (existing) =>
                existing.text.toLowerCase() === task.text.toLowerCase()
            )
        );
        const enrichedNewTasks = dedupedNewTasks.map((task, idx) => ({
          ...task,
          id: task.id ?? `task-${targetSessionId}-${Date.now()}-${idx}`,
          createdAt: task.createdAt ?? new Date(),
        }));
        const mergedTasks = [...existingTasks, ...enrichedNewTasks];
        newTasks = enrichedNewTasks;

        if (newTasks.length === 0 && analysis.tasks.length > 0) {
          console.log("ℹ️ All suggested tasks already exist, skipping add.");
        }

        metadataUpdate = {
          ...targetSession.metadata,
          tasks: mergedTasks,
        };

        if (shouldSyncUI) {
          setTasks(mergedTasks);
        }
      }
      // Persist updates if needed
      if (documentationUpdate || metadataUpdate) {
        await storage.updateSession(targetSessionId, {
          ...(documentationUpdate ? { documentation: documentationUpdate } : {}),
          ...(metadataUpdate ? { metadata: metadataUpdate } : {}),
        });

        if (shouldSyncUI) {
          setSession((prev) => {
            if (!prev || prev.id !== targetSessionId) return prev;
            return {
              ...prev,
              documentation: documentationUpdate ?? prev.documentation,
              metadata: metadataUpdate ?? prev.metadata,
            };
          });
        }
      }

      if (shouldSyncUI) {
        if (analysis.vitalSigns && Object.keys(analysis.vitalSigns).length > 0) {
          showToast(
            `Extracted ${Object.keys(analysis.vitalSigns).length} vital signs`,
            "success"
          );
        }
        if (newTasks && newTasks.length > 0) {
          showToast(`Created ${newTasks.length} tasks`, "success");
        }
      }

      console.log("✅ Transcript analysis complete");
    } catch (error) {
      console.error("❌ Failed to analyze transcript:", error);
      if (currentViewSessionIdRef.current === targetSessionId) {
        showToast("Failed to analyze transcript", "error");
      }
    }
  };

  const handleGenerateNote = async () => {
    if (
      !session ||
      !selectedTemplate ||
      !session.transcript ||
      session.transcript.length === 0
    ) {
      showToast(
        "Please select a template and ensure you have a transcript",
        "error"
      );
      return;
    }

    const targetSessionId = session.id;

    const fullTranscript = session.transcript
      .map((seg) => `${seg.speaker}: ${seg.text}`)
      .join("\n");

    await generateNoteFromTranscript(fullTranscript, targetSessionId);
  };

  const handleSaveNote = async () => {
    if (!session) return;

    try {
      setSavingNote(true);
      const storage = new StorageService();
      await storage.updateSession(session.id, {
        documentation: {
          ...session.documentation,
          clinicalNote: generatedNote,
          lastUpdated: new Date(),
        },
      });
      showToast("Note saved successfully", "success");
    } catch (error) {
      console.error("Failed to save note:", error);
      showToast("Failed to save note", "error");
    } finally {
      setSavingNote(false);
    }
  };

  const handleVitalSignsUpdate = async (vitals: any) => {
    if (!session) return;

    try {
      const storage = new StorageService();
      await storage.updateSession(session.id, {
        documentation: {
          ...session.documentation,
          soapNote: {
            ...session.documentation.soapNote,
            objective: {
              ...session.documentation.soapNote.objective,
              vitalSigns: {
                bloodPressure: vitals.bloodPressure,
                heartRate: vitals.heartRate,
                temperature: vitals.temperature,
                respiratoryRate: vitals.respiratoryRate,
                oxygenSaturation: vitals.oxygenSaturation,
                weight: vitals.weight,
                height: vitals.height,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Failed to save vital signs:", error);
    }
  };

  const handleAIMessage = (message: string) => {
    console.log("AI message:", message);
    showToast("AI assistant coming soon!", "info");
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const renderTabContent = () => {
    if (!session) return null;

    switch (activeTab) {
      case "transcript":
        return (
          <TranscriptView
            segments={session.transcript}
            isRecording={isRecording}
          />
        );

      case "context":
        return (
          <ContextView
            vitalSigns={vitalSigns}
            onVitalSignsUpdate={handleVitalSignsUpdate}
          />
        );

      case "note":
        return (
          <div className="space-y-4 h-full flex flex-col">
            <TemplateSelector
              templates={availableTemplates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
              onGenerateNote={handleGenerateNote}
              isGenerating={generatingNote}
            />
            <div className="flex-1 min-h-0">
              <NoteDisplay
                note={generatedNote}
                onNoteChange={setGeneratedNote}
                onSave={handleSaveNote}
                isSaving={savingNote}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Sessions list */}
          <aside className="hidden lg:flex lg:w-72 xl:w-80 bg-white border-r border-gray-200 flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  AS
                </div>
                <div>
                  <div className="text-sm font-semibold">Abc S</div>
                  <div className="text-xs text-gray-500">sanjay@123.com</div>
                </div>
              </div>
              <button
                onClick={handleNewSessionClick}
                className="mt-4 w-full bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center space-x-2"
              >
                <span className="text-lg">⊕</span>
                <span>New session</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <RecentSessionsList
                sessionManager={sessionManager}
                onSessionSelect={(id) => navigate(`/session/${id}`)}
                refreshTrigger={sessionListRefresh}
              />
            </div>
            <div className="p-4 border-t border-gray-200 space-y-2">
              <button className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2">
                <span>📋</span>
                <span>Template library</span>
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-w-0">
            <HeaderBar
              patientDetails={patientDetails}
              onPatientDetailsChange={handlePatientDetailsChange}
              onResume={() => showToast("Resume feature coming soon", "info")}
              isRecording={isRecording}
              duration={duration}
              onToggleRecording={handleVoiceInput}
              onUploadAudio={handleUploadAudio}
            />

            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {renderTabContent()}
            </div>

            {/* Mobile-only supplements */}
            <div className="lg:hidden px-4 pb-4 space-y-4">
              <section className="bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">Sessions</h2>
                  <button
                    onClick={handleNewSessionClick}
                    className="flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <span className="text-base leading-none">⊕</span>
                    <span>New</span>
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  <RecentSessionsList
                    sessionManager={sessionManager}
                    onSessionSelect={(id) => navigate(`/session/${id}`)}
                    refreshTrigger={sessionListRefresh}
                  />
                </div>
              </section>

              <TasksPanel
                sessionId={session?.id}
                tasks={tasks}
                onTasksChange={setTasks}
                variant="mobile"
              />
            </div>

            <div className="border-t border-gray-200 bg-white px-4 py-4">
              <AIInputBar
                onSendMessage={handleAIMessage}
                onVoiceInput={handleVoiceInput}
                disabled={false}
                isRecording={isRecording}
              />
            </div>
          </main>

          {/* Desktop tasks */}
          <aside className="hidden lg:flex lg:w-80 bg-white border-l border-gray-200">
            <TasksPanel
              sessionId={session?.id}
              tasks={tasks}
              onTasksChange={setTasks}
              variant="desktop"
            />
          </aside>
        </div>

        <RecordingButton
          isRecording={isRecording}
          onToggle={handleVoiceInput}
          duration={duration}
        />
      </div>
    </>
  );
};
