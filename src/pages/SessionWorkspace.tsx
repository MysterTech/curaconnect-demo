import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Session } from "../models/types";
import { SessionManager } from "../services/SessionManager";
import { StorageService } from "../services/StorageService";
import { EnhancedRecordingController } from "../services/EnhancedRecordingController";
import { TranscriptionServiceManager } from "../services/TranscriptionServiceManager";
import { DocumentationGenerator } from "../services/DocumentationGenerator";
import { userSettingsService } from "../services/UserSettingsService";
import { getTemplatesBySpecialty, getTemplateById, NoteTemplate } from "../models/templates";
import { clinicalEntityExtractor, ClinicalEntity, SOAPElements } from "../services/ClinicalEntityExtractor";
import { useToast } from "../components/Toast";

type TabType = "transcript" | "context" | "note" | "entities";

const RecentSessionsList: React.FC<{ sessionManager: SessionManager }> = ({ sessionManager }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await sessionManager.listSessions();
      // Sort by date, most recent first
      const sorted = allSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setSessions(sorted.slice(0, 10)); // Show last 10 sessions
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds === 0) return "0 mins";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins} mins`;
  };

  const groupedSessions: { [key: string]: Session[] } = {};
  sessions.forEach(session => {
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
            <div 
              key={session.id}
              className="px-2 py-2 hover:bg-gray-50 rounded"
            >
              {editingId === session.id ? (
                <div className="flex items-center space-x-2">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        // Save on Enter
                        try {
                          setIsSaving(true);
                          const storage = new StorageService();
                          const existing = await storage.getSession(session.id);
                          if (existing) {
                            await storage.updateSession(session.id, {
                              patientContext: {
                                ...existing.patientContext,
                                identifier: editingName.trim(),
                              },
                            });
                            await loadSessions();
                          }
                        } catch (err) {
                          console.error('Failed to rename session:', err);
                        } finally {
                          setIsSaving(false);
                          setEditingId(null);
                          setEditingName('');
                        }
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditingName('');
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter patient name"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      try {
                        setIsSaving(true);
                        const storage = new StorageService();
                        const existing = await storage.getSession(session.id);
                        if (existing) {
                          await storage.updateSession(session.id, {
                            patientContext: {
                              ...existing.patientContext,
                              identifier: editingName.trim(),
                            },
                          });
                          await loadSessions();
                        }
                      } catch (err) {
                        console.error('Failed to rename session:', err);
                      } finally {
                        setIsSaving(false);
                        setEditingId(null);
                        setEditingName('');
                      }
                    }}
                    className="text-green-600 hover:text-green-700"
                    title="Save"
                    disabled={isSaving}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditingName(''); }}
                    className="text-gray-500 hover:text-gray-700"
                    title="Cancel"
                    disabled={isSaving}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/session/${session.id}`)}
                      className={`text-left flex-1 text-sm ${
                        (session.patientContext?.identifier || session.patientIdentifier)
                          ? 'font-medium text-gray-900'
                          : 'text-gray-500'
                      }`}
                      title="Open session"
                    >
                      {session.patientContext?.identifier || session.patientIdentifier || 'Untitled session'}
                    </button>
                    <button
                      onClick={() => {
                        const name = session.patientContext?.identifier || session.patientIdentifier || '';
                        setEditingId(session.id);
                        setEditingName(name);
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit patient name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(session.createdAt)} · {formatDuration(session.metadata?.duration)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="px-2 py-4 text-center text-sm text-gray-400">
          No sessions yet
        </div>
      )}
    </>
  );
};

export const SessionWorkspace: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("note");
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState("00:00");
  const [showRecordingDropdown, setShowRecordingDropdown] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState("");
  const [isEditingPatientDetails, setIsEditingPatientDetails] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<NoteTemplate[]>([]);
  const [generatedNote, setGeneratedNote] = useState<string>("");
  const [clinicalEntities, setClinicalEntities] = useState<ClinicalEntity[]>([]);
  const [soapElements, setSOAPElements] = useState<SOAPElements | null>(null);
  const [extractingEntities, setExtractingEntities] = useState(false);
  const [generatingNote, setGeneratingNote] = useState(false);
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  });

  const [sessionManager] = useState(() => 
    new SessionManager(
      new StorageService(),
      new EnhancedRecordingController(),
      new TranscriptionServiceManager(),
      new DocumentationGenerator()
    )
  );

  useEffect(() => {
    if (sessionId && sessionId !== 'new' && sessionId !== 'test-session') {
      loadSession(sessionId);
    } else if (sessionId === 'new') {
      // Create a new session automatically
      createNewSession();
    }
    
    // Load available templates based on user specialty
    const userSpecialty = userSettingsService.getSpecialty();
    const templates = getTemplatesBySpecialty(userSpecialty);
    setAvailableTemplates(templates);
    
    // Set default template from user settings
    const defaultTemplateId = userSettingsService.getDefaultTemplate();
    if (defaultTemplateId && !selectedTemplate) {
      const template = templates.find(t => t.id === defaultTemplateId);
      if (template) {
        console.log('📋 Setting default template from settings:', template.name);
        setSelectedTemplate(template);
      } else {
        console.warn('⚠️ Saved default template not found:', defaultTemplateId);
      }
    }
  }, [sessionId]);

  const createNewSession = async () => {
    try {
      const newSession = await sessionManager.createSession({
        identifier: '',
        visitType: 'consultation'
      });
      setSession(newSession);
      // Update URL to use the actual session ID
      navigate(`/session/${newSession.id}`, { replace: true });
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  // Update duration timer while recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  // Set up session update listener
  useEffect(() => {
    const handleSessionUpdate = (updatedSession: Session) => {
      setSession({ ...updatedSession, transcript: [...updatedSession.transcript] });
    };

    sessionManager.onSessionUpdate(handleSessionUpdate);
    
    return () => {
      // Cleanup if needed
    };
  }, [sessionManager]);

  const loadSession = async (id: string) => {
    try {
      const loadedSession = await sessionManager.getSession(id);
      setSession(loadedSession);
      setHasStartedSession(true);
      // Load patient details if available
      if (loadedSession.patientContext?.identifier) {
        setPatientDetails(loadedSession.patientContext.identifier);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const updatePatientDetails = async () => {
    if (!session) return;
    
    try {
      const updatedSession = {
        ...session,
        patientContext: {
          ...session.patientContext,
          identifier: patientDetails
        },
        updatedAt: new Date()
      };
      
      // Save to storage
      await sessionManager.getSession(session.id);
      setSession(updatedSession);
      setIsEditingPatientDetails(false);
      
      console.log('✅ Patient details saved');
    } catch (error) {
      console.error("❌ Failed to update patient details:", error);
      alert('Failed to save patient details. Please try again.');
    }
  };

  const saveVitalSigns = async () => {
    if (!session) return;
    
    try {
      const updatedSession = {
        ...session,
        documentation: {
          ...session.documentation,
          soapNote: {
            ...session.documentation.soapNote,
            objective: {
              ...session.documentation.soapNote.objective,
              vitalSigns: {
                bloodPressure: vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureDiastolic 
                  ? `${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic}` 
                  : undefined,
                heartRate: vitalSigns.heartRate ? parseInt(vitalSigns.heartRate) : undefined,
                temperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : undefined,
                respiratoryRate: vitalSigns.respiratoryRate ? parseInt(vitalSigns.respiratoryRate) : undefined,
                oxygenSaturation: vitalSigns.oxygenSaturation ? parseInt(vitalSigns.oxygenSaturation) : undefined,
                weight: vitalSigns.weight ? parseFloat(vitalSigns.weight) : undefined,
                height: vitalSigns.height ? parseFloat(vitalSigns.height) : undefined,
              }
            }
          }
        },
        updatedAt: new Date()
      };
      
      setSession(updatedSession);
      console.log('✅ Vital signs saved');
      alert('Vital signs saved successfully!');
    } catch (error) {
      console.error("❌ Failed to save vital signs:", error);
      alert('Failed to save vital signs. Please try again.');
    }
  };

  const saveNote = async () => {
    if (!session || !generatedNote) return;
    
    try {
      const updatedSession = {
        ...session,
        documentation: {
          ...session.documentation,
          clinicalNote: generatedNote,
          lastUpdated: new Date()
        },
        updatedAt: new Date()
      };
      
      setSession(updatedSession);
      console.log('✅ Note saved');
      alert('Note saved successfully!');
    } catch (error) {
      console.error("❌ Failed to save note:", error);
      alert('Failed to save note. Please try again.');
    }
  };

  const startRecording = async (mode: 'transcribing' | 'invoicing' | 'upload') => {
    let currentSession = session;
    
    if (!currentSession) {
      // Create a session if one doesn't exist
      const newSession = await sessionManager.createSession({
        identifier: sessionId === 'test-session' ? 'TEST-PATIENT' : '',
        visitType: 'consultation'
      });
      setSession(newSession);
      currentSession = newSession;
      
      // Update URL if we're on a temporary route
      if (sessionId === 'test-session' || sessionId === 'new') {
        navigate(`/session/${newSession.id}`, { replace: true });
      }
    }
    
    if (currentSession) {
      try {
        await sessionManager.startSession(currentSession.id);
        setIsRecording(true);
        setHasStartedSession(true);
        setShowRecordingDropdown(false);
        setRecordingStartTime(Date.now());
        setDuration("0:00");
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }
  };

  const stopRecording = async () => {
    if (!session) return;
    
    try {
      await sessionManager.stopSession(session.id);
      setIsRecording(false);
      setRecordingStartTime(null);
      
      // Reload session to get updated duration
      const updatedSession = await sessionManager.getSession(session.id);
      setSession(updatedSession);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateNoteFromTranscript = async () => {
    if (!session || !selectedTemplate || !session.transcript || session.transcript.length === 0) {
      console.log('Cannot generate note: missing session, template, or transcript');
      alert('Please select a template and ensure you have a transcript before generating a note.');
      return;
    }

    try {
      setGeneratingNote(true);
      console.log('🤖 Generating note using template:', selectedTemplate.name);
      
      // Combine all transcript segments into one text
      const fullTranscript = session.transcript
        .map(seg => `${seg.speaker}: ${seg.text}`)
        .join('\n');

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
${fullTranscript}

Generate a medical note with these sections (only fill in what's actually mentioned):
${selectedTemplate.sections.map(s => `
${s.title}:
${s.required ? '(Required - extract from transcript if available, otherwise write "Not documented")' : '(Optional - only include if mentioned in transcript)'}
`).join('\n')}

Remember: Accuracy over completeness. Only document what was actually said.`;

      console.log('📤 Sending prompt to AI...');

      // Call Gemini API to generate the note
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.1,  // Very low temperature for factual accuracy
              topP: 0.8,         // Lower topP to reduce randomness
              topK: 20,          // Lower topK for more focused responses
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let generatedText = data.candidates[0].content.parts[0].text;
      
      // Post-process to remove common hallucination patterns
      generatedText = generatedText
        .replace(/\[.*?\]/g, '') // Remove placeholder brackets
        .replace(/\(example:.*?\)/gi, '') // Remove example text
        .replace(/\(placeholder.*?\)/gi, '') // Remove placeholder text
        .replace(/e\.g\.,.*?(?=\n|$)/gi, '') // Remove "e.g." examples
        .trim();
      
      console.log('✅ Note generated successfully');
      setGeneratedNote(generatedText);

    } catch (error) {
      console.error('❌ Failed to generate note:', error);
      alert('Failed to generate note. Please check your API key and try again.');
    } finally {
      setGeneratingNote(false);
    }
  };

  // Auto-save note every 30 seconds
  useEffect(() => {
    if (generatedNote && session) {
      const autoSaveTimer = setInterval(() => {
        console.log('💾 Auto-saving note...');
        saveNote();
      }, 30000); // 30 seconds
      
      return () => clearInterval(autoSaveTimer);
    }
  }, [generatedNote, session]);

  // Extract clinical entities when transcript updates
  const extractClinicalEntities = async () => {
    if (!session || !session.transcript || session.transcript.length === 0) {
      return;
    }

    try {
      setExtractingEntities(true);
      console.log('🔍 Extracting clinical entities...');

      const fullTranscript = session.transcript
        .map(seg => seg.text)
        .join(' ');

      // Extract both general entities and SOAP elements
      const [entities, soap] = await Promise.all([
        clinicalEntityExtractor.extractEntities(fullTranscript),
        clinicalEntityExtractor.extractSOAPElements(fullTranscript)
      ]);

      console.log('✅ Extracted', entities.length, 'clinical entities');
      setClinicalEntities(entities);
      setSOAPElements(soap);

    } catch (error) {
      console.error('❌ Failed to extract entities:', error);
    } finally {
      setExtractingEntities(false);
    }
  };

  // Auto-generate note when transcript updates (if template is selected)
  useEffect(() => {
    if (session && session.transcript && session.transcript.length > 0) {
      // Debounce: only generate after transcript stops updating for 5 seconds
      const timer = setTimeout(() => {
        if (selectedTemplate && !generatedNote) {
          generateNoteFromTranscript();
        }
        // Always extract entities
        extractClinicalEntities();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [session?.transcript, selectedTemplate]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Session List */}
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
            <button className="p-1 hover:bg-gray-100 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
          </div>
          <button 
            onClick={async () => {
              try {
                const newSession = await sessionManager.createSession({
                  identifier: '',
                  visitType: 'consultation'
                });
                navigate(`/session/${newSession.id}`);
              } catch (error) {
                console.error('Failed to create new session:', error);
              }
            }}
            className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center space-x-2"
          >
            <span className="text-lg">⊕</span>
            <span>New session</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <button className="w-full text-left px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded">
              Schedule
            </button>
            <button className="w-full text-left px-2 py-1.5 text-xs font-medium text-gray-900 bg-gray-100 rounded">
              Past
            </button>
            <button className="w-full text-left px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded">
              And past
            </button>
          </div>

          <div className="space-y-1 px-2 mt-2">
            <RecentSessionsList sessionManager={sessionManager} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <button className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2">
            <span>📋</span>
            <span>Template library</span>
          </button>
          <button className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2">
            <span>👥</span>
            <span>Community</span>
          </button>
          <button className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2">
            <span>👥</span>
            <span>Team</span>
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center space-x-2"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </div>

        <div className="p-4 border-t border-gray-200 text-xs text-gray-500 space-y-2">
          <button className="hover:text-gray-700">💰 Earn $50</button>
          <button className="hover:text-gray-700">📞 Request a feature</button>
          <button className="hover:text-gray-700">⌨️ Shortcuts</button>
          <button className="hover:text-gray-700">❓ Help</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <button 
                onClick={() => navigate('/sessions')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {isEditingPatientDetails ? (
                <div className="flex items-center space-x-2 flex-1 max-w-md">
                  <input
                    type="text"
                    value={patientDetails}
                    onChange={(e) => setPatientDetails(e.target.value)}
                    onBlur={updatePatientDetails}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updatePatientDetails();
                      } else if (e.key === 'Escape') {
                        setIsEditingPatientDetails(false);
                      }
                    }}
                    placeholder="Enter patient name or details..."
                    className="flex-1 px-3 py-1.5 text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={updatePatientDetails}
                    className="text-green-600 hover:text-green-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsEditingPatientDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 
                    onClick={() => setIsEditingPatientDetails(true)}
                    className="text-lg font-semibold cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    {patientDetails || "Add patient details"}
                  </h1>
                  <button
                    onClick={() => setIsEditingPatientDetails(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {!isRecording ? (
                <button
                  onClick={() => startRecording('transcribing')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center space-x-2"
                >
                  <span>▶ Start transcribing</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 bg-white rounded-sm"></span>
                    <span>Stop recording</span>
                  </button>
                  <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    <span>Recording</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">Today 06:07PM</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="text-gray-700">English</span>
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                ✓ 14 days
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <div className="flex space-x-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`w-1 h-4 rounded ${i <= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Default - Microphone...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-1 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === "transcript"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>📝</span>
              <span>Transcript</span>
            </button>
            <button
              onClick={() => setActiveTab("context")}
              className={`px-1 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === "context"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>📋</span>
              <span>Context</span>
            </button>
            <button
              onClick={() => setActiveTab("note")}
              className={`px-1 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === "note"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>📄</span>
              <span>Note</span>
            </button>
            <button
              onClick={() => setActiveTab("entities")}
              className={`px-1 py-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === "entities"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>🏥</span>
              <span>Clinical Entities</span>
              {clinicalEntities.length > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                  {clinicalEntities.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-6">
            {!hasStartedSession ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="text-center max-w-md">
                  <div className="mb-6 relative">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Start this session using the header
                    </h2>
                    <svg className="absolute -right-20 -top-10 w-32 h-32 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 100 100">
                      <path d="M 20 80 Q 40 20, 80 10" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                          <polygon points="0 0, 10 5, 0 10" fill="currentColor" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Your note will appear here once your session is complete
                  </p>
                  
                  <button
                    onClick={() => startRecording('transcribing')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center space-x-2"
                  >
                    <span>▶ Start transcribing</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "note" && (
                  <div className="space-y-6">
                    {/* Template Selector */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <button 
                            onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <span>📋</span>
                            <span>{selectedTemplate ? selectedTemplate.name : 'Select a template'}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {showTemplateDropdown && (
                            <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 max-h-96 overflow-y-auto">
                              <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                                Available Templates
                              </div>
                              {availableTemplates.map((template) => (
                                <button
                                  key={template.id}
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    setShowTemplateDropdown(false);
                                    setGeneratedNote(''); // Reset note when template changes
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  {selectedTemplate?.id === template.id && (
                                    <span className="text-indigo-600">✓</span>
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                    <div className="text-xs text-gray-500">{template.description}</div>
                                  </div>
                                </button>
                              ))}
                              {availableTemplates.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                  No templates available. Go to Settings to select your specialty.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
                          ✏️ Free
                        </button>
                        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
                          🎨 Custom
                        </button>
                        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">
                          ⋯
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-600">Copy ▼</span>
                      </div>
                    </div>

                    {/* Medical Documentation */}
                    {generatedNote || session?.transcript?.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            {generatedNote && (
                              <>
                                <span className="text-sm text-green-600 font-medium">✓ AI Generated</span>
                                {selectedTemplate && (
                                  <span className="text-xs text-gray-500">using {selectedTemplate.name}</span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {session?.transcript && session.transcript.length > 0 && (
                              <button
                                onClick={generateNoteFromTranscript}
                                disabled={!selectedTemplate || generatingNote}
                                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 disabled:opacity-50"
                              >
                                {generatingNote ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>{generatedNote ? 'Regenerate' : 'Generate Note'}</span>
                                  </>
                                )}
                              </button>
                            )}
                            {!selectedTemplate && session?.transcript && session.transcript.length > 0 && (
                              <button
                                onClick={() => setShowTemplateDropdown(true)}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                              >
                                Select template first
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Editable Note Area */}
                        <div>
                          <textarea
                            value={generatedNote}
                            onChange={(e) => setGeneratedNote(e.target.value)}
                            placeholder="AI-generated note will appear here. You can edit it freely.

Start recording to generate a note, or type your own notes here..."
                            className="w-full min-h-[500px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm leading-relaxed"
                            style={{ whiteSpace: 'pre-wrap' }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            {generatedNote.length} characters
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(generatedNote);
                                // Show toast notification
                                console.log('Note copied to clipboard');
                              }}
                              className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Copy
                            </button>
                            <button
                              onClick={saveNote}
                              className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (

                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">No documentation generated yet</p>
                        <p className="text-gray-400 text-xs mt-1">Start recording to generate documentation</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "transcript" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Transcript</h3>
                    {session?.transcript && session.transcript.length > 0 ? (
                      <div className="space-y-3">
                        {session.transcript.map((segment) => (
                          <div key={segment.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">
                              {segment.speaker === "provider" ? "Provider" : "Patient"}
                            </div>
                            <p className="text-gray-900">{segment.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No transcript available yet. Start recording to see transcription.</p>
                    )}
                  </div>
                )}

                {activeTab === "context" && (
                  <div className="space-y-6">
                    {/* Vital Signs */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <span>🩺</span>
                        <span>Vital Signs</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Blood Pressure */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Pressure (mmHg)
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={vitalSigns.bloodPressureSystolic}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressureSystolic: e.target.value })}
                              placeholder="120"
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-gray-500">/</span>
                            <input
                              type="number"
                              value={vitalSigns.bloodPressureDiastolic}
                              onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressureDiastolic: e.target.value })}
                              placeholder="80"
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Heart Rate */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Heart Rate (bpm)
                          </label>
                          <input
                            type="number"
                            value={vitalSigns.heartRate}
                            onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                            placeholder="72"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Temperature */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature (°F)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={vitalSigns.temperature}
                            onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                            placeholder="98.6"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Respiratory Rate */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Respiratory Rate (breaths/min)
                          </label>
                          <input
                            type="number"
                            value={vitalSigns.respiratoryRate}
                            onChange={(e) => setVitalSigns({ ...vitalSigns, respiratoryRate: e.target.value })}
                            placeholder="16"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Oxygen Saturation */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Oxygen Saturation (%)
                          </label>
                          <input
                            type="number"
                            value={vitalSigns.oxygenSaturation}
                            onChange={(e) => setVitalSigns({ ...vitalSigns, oxygenSaturation: e.target.value })}
                            placeholder="98"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Weight */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={vitalSigns.weight}
                            onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
                            placeholder="70"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Height */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Height (cm)
                          </label>
                          <input
                            type="number"
                            value={vitalSigns.height}
                            onChange={(e) => setVitalSigns({ ...vitalSigns, height: e.target.value })}
                            placeholder="170"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* BMI Calculation */}
                        {vitalSigns.weight && vitalSigns.height && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              BMI
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                              {(parseFloat(vitalSigns.weight) / Math.pow(parseFloat(vitalSigns.height) / 100, 2)).toFixed(1)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={() => setVitalSigns({
                            bloodPressureSystolic: '',
                            bloodPressureDiastolic: '',
                            heartRate: '',
                            temperature: '',
                            respiratoryRate: '',
                            oxygenSaturation: '',
                            weight: '',
                            height: '',
                          })}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={saveVitalSigns}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                          Save Vital Signs
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <span>⚡</span>
                        <span>Quick Actions</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2">
                          <span>💊</span>
                          <span>Add Medication</span>
                        </button>
                        <button className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2">
                          <span>🔬</span>
                          <span>Order Lab Test</span>
                        </button>
                        <button className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2">
                          <span>📋</span>
                          <span>Add Diagnosis</span>
                        </button>
                        <button className="px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2">
                          <span>📅</span>
                          <span>Schedule Follow-up</span>
                        </button>
                      </div>
                    </div>

                    {/* Patient History */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <span>📖</span>
                        <span>Patient History</span>
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Allergies
                          </label>
                          <textarea
                            placeholder="List any known allergies..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Medications
                          </label>
                          <textarea
                            placeholder="List current medications..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Past Medical History
                          </label>
                          <textarea
                            placeholder="Previous conditions, surgeries..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "entities" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Clinical Entities</h3>
                      <button
                        onClick={extractClinicalEntities}
                        disabled={extractingEntities || !session?.transcript || session.transcript.length === 0}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{extractingEntities ? 'Extracting...' : 'Refresh'}</span>
                      </button>
                    </div>

                    {extractingEntities ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-sm">Analyzing transcript...</p>
                      </div>
                    ) : soapElements ? (
                      <div className="space-y-6">
                        {/* SOAP Elements */}
                        {(['subjective', 'objective', 'assessment', 'plan'] as const).map((section) => (
                          <div key={section} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 capitalize flex items-center space-x-2">
                              <span>{section === 'subjective' ? '🗣️' : section === 'objective' ? '🔬' : section === 'assessment' ? '🎯' : '📋'}</span>
                              <span>{section}</span>
                              <span className="text-xs text-gray-500 font-normal">
                                ({soapElements[section].length} entities)
                              </span>
                            </h4>
                            {soapElements[section].length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {soapElements[section].map((entity, idx) => (
                                  <div
                                    key={idx}
                                    className={`px-3 py-1.5 rounded-lg border text-sm ${clinicalEntityExtractor.getEntityColor(entity.type)}`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{entity.value}</span>
                                      <span className={`text-xs ${clinicalEntityExtractor.getConfidenceColor(entity.confidence)}`}>
                                        {Math.round(entity.confidence * 100)}%
                                      </span>
                                    </div>
                                    <div className="text-xs opacity-75 mt-0.5 capitalize">{entity.type.replace('-', ' ')}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No {section} entities found</p>
                            )}
                          </div>
                        ))}

                        {/* Legend */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Entity Types:</h4>
                          <div className="flex flex-wrap gap-2">
                            {(['symptom', 'diagnosis', 'medication', 'procedure', 'vital-sign', 'lab-value'] as const).map((type) => (
                              <div key={type} className={`px-2 py-1 rounded text-xs ${clinicalEntityExtractor.getEntityColor(type)}`}>
                                {type.replace('-', ' ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-500 text-sm">No clinical entities extracted yet</p>
                        <p className="text-gray-400 text-xs mt-1">Start recording to extract medical entities</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Ask AI Saboo to do anything..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-orange-500 mt-2 text-center flex items-center justify-center space-x-1">
              <span>⚠️</span>
              <span>Review your note before use to ensure it accurately represents the visit</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
