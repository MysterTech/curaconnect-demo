import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export const SessionWorkspaceNew: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
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
  const createNewSession = React.useCallback(async () => {
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
      setSession(newSession);

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
    } catch (error) {
      console.error("❌ Failed to create session:", error);
      showToast("Failed to create session", "error");
    } finally {
      setIsCreatingSession(false);
    }
  }, [sessionManager, navigate, showToast, isCreatingSession]);

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

    // Skip if we're currently creating a session
    if (isCreatingSession) {
      console.log("⏳ Session creation in progress, skipping initialization");
      return;
    }

    // Only proceed if we don't already have this session loaded
    if (session && session.id === sessionId) {
      console.log("✅ Session already loaded, skipping initialization");
      return;
    }

    if (sessionId && sessionId !== "new") {
      // Load existing session
      console.log("📂 Loading existing session:", sessionId);
      loadSession(sessionId);
    } else if (sessionId === "new" || !sessionId) {
      // Auto-create session when navigating to /session/new OR when no sessionId
      console.log("🆕 Auto-creating new session (sessionId:", sessionId, ")");
      createNewSession();
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
  }, [sessionId]);

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

  const handleNewSessionClick = async () => {
    console.log("🔘 New session button clicked");

    if (isCreatingSession) {
      console.log("⚠️ Already creating a session, ignoring click");
      return;
    }

    // Always create a fresh session when button is clicked
    setIsCreatingSession(true);
    try {
      const newSession = await sessionManager.createSession({
        identifier: "",
        visitType: "consultation",
      });
      console.log("✅ Session created from button click:", newSession.id);
      setSession(newSession);

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
      showToast("New session created", "success");
    } catch (error) {
      console.error("Failed to create session:", error);
      showToast("Failed to create session", "error");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const loadedSession = await sessionManager.getSession(id);
      setSession(loadedSession);

      // Sync recording state with loaded session
      const shouldBeRecording = loadedSession.status === "active";
      setIsRecording(shouldBeRecording);
      if (!shouldBeRecording) {
        setRecordingStartTime(null);
        setDuration("00:00");
      }

      if (loadedSession.patientContext?.identifier) {
        setPatientDetails(loadedSession.patientContext.identifier);
      }
      if (loadedSession.documentation?.clinicalNote) {
        setGeneratedNote(loadedSession.documentation.clinicalNote);
      }

      // Load vital signs if available
      if (loadedSession.documentation?.soapNote?.objective?.vitalSigns) {
        setVitalSigns(
          loadedSession.documentation.soapNote.objective.vitalSigns
        );
      }

      // Load tasks from session metadata
      if (loadedSession.metadata?.tasks) {
        setTasks(loadedSession.metadata.tasks);
      }

      // Mark tasks as loaded to enable auto-save
      setTasksLoaded(true);
    } catch (error) {
      console.error("Failed to load session:", error);
      showToast("Failed to load session", "error");
    }
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
      console.log("🛑 Stopping recording for session:", session.id);
      await sessionManager.stopSession(session.id);
      setIsRecording(false);
      setRecordingStartTime(null);
      setDuration("00:00");
      showToast("Recording stopped", "success");

      // Reload session to get updated transcript
      console.log("📥 Reloading session to get updated transcript...");
      const updatedSession = await sessionManager.getSession(session.id);
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

      setSession(updatedSession);

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
        showToast("Analyzing transcript...", "info");
        await analyzeTranscript(fullTranscript);

        // Then auto-generate note if template is selected
        if (selectedTemplate) {
          console.log(
            "📝 Auto-generating note with template:",
            selectedTemplate.name
          );
          showToast("Generating note...", "info");
          await generateNoteFromTranscript(fullTranscript);
        }
      } else {
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
      console.log(
        "📤 Processing uploaded audio file:",
        file.name,
        file.type,
        file.size
      );
      showToast("Converting audio format...", "info");

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
          showToast("Audio converted successfully", "success");
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

      showToast("Transcribing audio...", "info");

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
        setSession(updatedSession);

        // Save to storage
        const storage = new StorageService();
        await storage.updateSession(session.id, {
          transcript: updatedSession.transcript,
        });

        showToast(`Transcribed ${result.segments.length} segments`, "success");

        // Analyze the transcript and auto-generate note
        const fullTranscript = result.segments.map((s) => s.text).join(" ");
        console.log(
          "🔍 Analyzing transcript:",
          fullTranscript.substring(0, 100) + "..."
        );

        // First analyze for tasks and vital signs
        await analyzeTranscript(fullTranscript);

        // Then auto-generate note if template is selected
        if (selectedTemplate) {
          console.log(
            "📝 Auto-generating note with template:",
            selectedTemplate.name
          );
          showToast("Generating note...", "info");
          await generateNoteFromTranscript(fullTranscript);
        }
      } else {
        console.warn("⚠️ No segments in transcription result");
        showToast("No speech detected in audio file", "error");
      }
    } catch (error) {
      console.error("❌ Failed to process audio file:", error);

      // Check if it's a Gemini API error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

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
  };

  const generateNoteFromTranscript = async (transcriptText: string) => {
    if (!selectedTemplate) {
      console.warn("⚠️ No template selected for note generation");
      return;
    }

    try {
      setGeneratingNote(true);
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
      setGeneratedNote(generatedText);
      showToast("Note generated successfully!", "success");

      // Auto-switch to Note tab to show the generated note
      setActiveTab("note");
    } catch (error) {
      console.error("❌ Failed to generate note:", error);
      showToast("Failed to generate note", "error");
    } finally {
      setGeneratingNote(false);
    }
  };

  const analyzeTranscript = async (transcriptText: string) => {
    try {
      console.log("🔍 Analyzing transcript for tasks and vital signs...");
      const analysis = await transcriptAnalyzer.analyzeTranscript(
        transcriptText
      );

      // Update vital signs if found
      if (analysis.vitalSigns && Object.keys(analysis.vitalSigns).length > 0) {
        console.log("✅ Extracted vital signs:", analysis.vitalSigns);
        setVitalSigns(analysis.vitalSigns);

        // Save to session
        if (session) {
          const storage = new StorageService();
          await storage.updateSession(session.id, {
            documentation: {
              ...session.documentation,
              soapNote: {
                ...session.documentation.soapNote,
                objective: {
                  ...session.documentation.soapNote.objective,
                  vitalSigns: analysis.vitalSigns,
                },
              },
            },
          });
        }
        showToast(
          `Extracted ${Object.keys(analysis.vitalSigns).length} vital signs`,
          "success"
        );
      }

      // Update tasks if found
      if (analysis.tasks && analysis.tasks.length > 0) {
        console.log("✅ Extracted tasks:", analysis.tasks);
        const newTasks: Task[] = analysis.tasks.map((task, index) => ({
          id: `task-${Date.now()}-${index}`,
          text: task.text,
          completed: false,
          priority: task.priority,
          category: task.category,
          createdAt: new Date(),
        }));
        setTasks(newTasks);
        showToast(`Created ${newTasks.length} tasks`, "success");
      }

      console.log("✅ Transcript analysis complete");
    } catch (error) {
      console.error("❌ Failed to analyze transcript:", error);
      showToast("Failed to analyze transcript", "error");
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

    try {
      setGeneratingNote(true);

      const fullTranscript = session.transcript
        .map((seg) => `${seg.speaker}: ${seg.text}`)
        .join("\n");

      const prompt = `You are a medical documentation assistant. Extract information from the consultation transcript and organize it into a structured medical note.

CRITICAL RULES:
1. ONLY include information explicitly mentioned in the transcript
2. DO NOT make up, infer, or hallucinate any medical information
3. If a section has no relevant information, write "Not documented"
4. Be accurate and conservative - when in doubt, leave it out

Template: ${selectedTemplate.name}
${selectedTemplate.aiPrompt}

Transcript:
${fullTranscript}

Generate a medical note with these sections:
${selectedTemplate.sections.map((s) => `${s.title}:`).join("\n")}`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.8,
              topK: 20,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text.trim();

      setGeneratedNote(generatedText);
      showToast("Note generated successfully", "success");
    } catch (error) {
      console.error("Failed to generate note:", error);
      showToast("Failed to generate note", "error");
    } finally {
      setGeneratingNote(false);
    }
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
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Sessions List */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  AS
                </div>
                <div>
                  <div className="text-sm font-semibold">Abc S</div>
                  <div className="text-xs text-gray-500">sanjay@123.com</div>
                </div>
              </div>
            </div>
            <button
              onClick={handleNewSessionClick}
              className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center space-x-2"
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

          <div className="p-4 border-t border-gray-200 space-y-1">
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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
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

          <div className="flex-1 overflow-hidden p-6">{renderTabContent()}</div>

          <AIInputBar
            onSendMessage={handleAIMessage}
            onVoiceInput={handleVoiceInput}
            disabled={false}
            isRecording={isRecording}
          />
        </div>

        {/* Right Sidebar - Tasks */}
        <TasksPanel
          sessionId={session?.id}
          tasks={tasks}
          onTasksChange={setTasks}
        />
      </div>

      {/* Floating Recording Button */}
      <RecordingButton
        isRecording={isRecording}
        onToggle={handleVoiceInput}
        duration={duration}
      />
    </>
  );
};
