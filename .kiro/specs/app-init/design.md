# Medical Scribe Application - Design Document

## Overview

The Medical Scribe Application is a web-based platform that captures clinical encounters through audio recording, transcribes conversations in real-time, and generates structured clinical documentation using AI. The system is designed to be used during patient visits, allowing healthcare providers to focus on patient care while the application handles documentation.

### Key Technologies

- **Frontend**: React with TypeScript for type safety and component-based architecture
- **Audio Processing**: Web Audio API for browser-based recording
- **Speech-to-Text**: Integration with speech recognition services (Web Speech API or cloud services like OpenAI Whisper)
- **AI Processing**: Large Language Models (gpt20b oss via openrouter or similar) for clinical documentation generation
- **State Management**: React Context API or Zustand for application state
- **Storage**: IndexedDB for local session storage, with optional backend integration
- **Styling**: Tailwind CSS for responsive, medical-professional UI

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│                      (React + TypeScript)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Session    │  │  Recording   │  │ Documentation│      │
│  │  Management  │  │   Manager    │  │   Generator  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transcription│  │   Storage    │  │     UI       │      │
│  │   Service    │  │   Service    │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Web Audio API│    │  IndexedDB   │    │  AI Service  │
│              │    │              │    │  (OpenAI)    │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Component Architecture

The application follows a modular architecture with clear separation of concerns:

1. **Presentation Layer**: React components for UI
2. **Business Logic Layer**: Services and managers for core functionality
3. **Data Layer**: Storage services and data models
4. **Integration Layer**: External API integrations (AI, speech services)

## Components and Interfaces

### 1. Core Data Models

#### Session Model
```typescript
interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed';
  patientContext?: {
    identifier?: string;
    visitType?: string;
  };
  transcript: TranscriptSegment[];
  documentation: ClinicalDocumentation;
  metadata: SessionMetadata;
}

interface TranscriptSegment {
  id: string;
  timestamp: number;
  speaker: 'provider' | 'patient' | 'unknown';
  text: string;
  confidence?: number;
}

interface SessionMetadata {
  duration: number;
  audioQuality?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
}
```

#### Clinical Documentation Model
```typescript
interface ClinicalDocumentation {
  soapNote: SOAPNote;
  clinicalEntities: ClinicalEntity[];
  lastUpdated: Date;
  isFinalized: boolean;
}

interface SOAPNote {
  subjective: {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    reviewOfSystems?: string;
  };
  objective: {
    vitalSigns?: VitalSigns;
    physicalExam?: string;
  };
  assessment: {
    diagnoses: string[];
    differentialDiagnoses?: string[];
  };
  plan: {
    medications?: Medication[];
    procedures?: string[];
    followUp?: string;
    patientInstructions?: string;
  };
}

interface ClinicalEntity {
  type: 'medication' | 'diagnosis' | 'symptom' | 'procedure' | 'allergy';
  value: string;
  confidence: number;
  context?: string;
}

interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
}

interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}
```

### 2. Recording Manager

Handles audio capture and processing.

```typescript
interface RecordingManager {
  startRecording(): Promise<void>;
  pauseRecording(): void;
  resumeRecording(): void;
  stopRecording(): Promise<Blob>;
  getRecordingState(): RecordingState;
  onAudioData(callback: (audioData: Float32Array) => void): void;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}
```

**Implementation Details**:
- Uses Web Audio API's MediaRecorder for browser-based recording
- Implements audio level monitoring for visual feedback
- Handles microphone permissions and errors gracefully
- Supports pause/resume functionality
- Chunks audio data for real-time processing

### 3. Transcription Service

Manages speech-to-text conversion with speaker diarization.

```typescript
interface TranscriptionService {
  initialize(): Promise<void>;
  transcribe(audioData: Blob | Float32Array): Promise<TranscriptSegment[]>;
  startRealtimeTranscription(onSegment: (segment: TranscriptSegment) => void): void;
  stopRealtimeTranscription(): void;
  identifySpeaker(segment: TranscriptSegment, context: TranscriptSegment[]): 'provider' | 'patient' | 'unknown';
}
```

**Implementation Details**:
- Primary option: OpenAI Whisper API for high-accuracy medical transcription
- Fallback option: Web Speech API for offline capability
- Implements speaker diarization using audio characteristics and context
- Handles real-time streaming transcription
- Manages API rate limits and error handling

### 4. Documentation Generator

AI-powered clinical documentation generation.

```typescript
interface DocumentationGenerator {
  generateDocumentation(transcript: TranscriptSegment[]): Promise<ClinicalDocumentation>;
  updateDocumentation(
    currentDoc: ClinicalDocumentation,
    newSegments: TranscriptSegment[]
  ): Promise<ClinicalDocumentation>;
  extractClinicalEntities(text: string): Promise<ClinicalEntity[]>;
  generateSOAPNote(transcript: TranscriptSegment[]): Promise<SOAPNote>;
  refineSectionWithContext(section: string, content: string, context: string): Promise<string>;
}
```

**Implementation Details**:
- Uses OpenAI GPT-4 or similar LLM with medical domain prompts
- Implements incremental documentation updates during active sessions
- Extracts structured clinical entities (medications, diagnoses, symptoms)
- Generates SOAP notes following clinical documentation standards
- Maintains context across multiple API calls for coherent documentation
- Implements confidence scoring for extracted information

### 5. Session Manager

Orchestrates session lifecycle and coordinates between services.

```typescript
interface SessionManager {
  createSession(patientContext?: PatientContext): Promise<Session>;
  startSession(sessionId: string): Promise<void>;
  pauseSession(sessionId: string): Promise<void>;
  resumeSession(sessionId: string): Promise<void>;
  stopSession(sessionId: string): Promise<void>;
  getSession(sessionId: string): Promise<Session>;
  listSessions(filter?: SessionFilter): Promise<Session[]>;
  deleteSession(sessionId: string): Promise<void>;
  updateDocumentation(sessionId: string, documentation: Partial<ClinicalDocumentation>): Promise<void>;
  finalizeSession(sessionId: string): Promise<void>;
}

interface SessionFilter {
  status?: Session['status'];
  dateRange?: { start: Date; end: Date };
  patientIdentifier?: string;
}
```

**Implementation Details**:
- Coordinates between recording, transcription, and documentation services
- Manages session state transitions
- Implements auto-save functionality
- Handles concurrent session operations
- Provides session recovery on application restart

### 6. Storage Service

Manages local data persistence.

```typescript
interface StorageService {
  saveSession(session: Session): Promise<void>;
  getSession(sessionId: string): Promise<Session | null>;
  getAllSessions(): Promise<Session[]>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  clearAllSessions(): Promise<void>;
  exportSession(sessionId: string, format: 'json' | 'pdf' | 'text'): Promise<Blob>;
}
```

**Implementation Details**:
- Uses IndexedDB for structured data storage
- Implements efficient querying and indexing
- Handles large transcript data with chunking
- Provides data export functionality
- Implements data cleanup and retention policies

## User Interface Components

### Design Philosophy

The UI follows modern SaaS design patterns inspired by Fireflies.ai, emphasizing:
- Clean, minimalist interface with ample white space
- Card-based layouts for content organization
- Prominent call-to-action buttons
- Real-time visual feedback
- Smooth transitions and micro-interactions
- Professional medical aesthetic with calming colors

### Color Palette

- **Primary**: Blue (#4F46E5) - Trust, professionalism, medical
- **Secondary**: Teal (#14B8A6) - Calm, healing
- **Success**: Green (#10B981) - Completion, positive outcomes
- **Warning**: Amber (#F59E0B) - Attention needed
- **Error**: Red (#EF4444) - Critical issues
- **Neutral**: Gray scale (#F9FAFB to #111827)
- **Background**: Light gray (#F9FAFB) with white cards

### 1. Dashboard / Home View

```
┌─────────────────────────────────────────────────────────────────┐
│  ☰ Medical Scribe    [🔍 Search]         [👤 Profile] [⚙️]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │         Welcome back, Dr. [Name]                         │   │
│  │                                                           │   │
│  │         [🎤 Start New Session]                           │   │
│  │         Large, prominent button with gradient            │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Recent Sessions                              [View All →]       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 📋 Session   │  │ 📋 Session   │  │ 📋 Session   │         │
│  │              │  │              │  │              │         │
│  │ Patient: *** │  │ Patient: *** │  │ Patient: *** │         │
│  │ 15 min ago   │  │ 2 hours ago  │  │ Yesterday    │         │
│  │              │  │              │  │              │         │
│  │ ✅ Complete  │  │ ⏸️ Draft     │  │ ✅ Complete  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│  Quick Stats                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 24           │  │ 6.2 hrs      │  │ 98%          │         │
│  │ Sessions     │  │ Saved        │  │ Accuracy     │         │
│  │ This Week    │  │ This Week    │  │ Rate         │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Active Session View (Fireflies-inspired)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                    [⏸️ Pause] [⏹ Stop]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔴 Recording  •  05:23                                          │
│  ▓▓▓▓▓▓▓▓░░░░░░░░  Audio Level                                  │
│                                                                   │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                       │
│  TRANSCRIPT              │  AI NOTES                             │
│  [Tab: Live] [Speakers]  │  [Tab: SOAP] [Summary] [Entities]    │
│                          │                                       │
│  ┌────────────────────┐ │  ┌─────────────────────────────────┐ │
│  │                    │ │  │ 📝 Chief Complaint              │ │
│  │ 👨‍⚕️ Provider        │ │  │                                 │ │
│  │ 00:12              │ │  │ Patient presents with...        │ │
│  │                    │ │  │                                 │ │
│  │ "Good morning,     │ │  │ [Auto-updating content]         │ │
│  │ how can I help     │ │  │                                 │ │
│  │ you today?"        │ │  └─────────────────────────────────┘ │
│  │                    │ │                                       │
│  └────────────────────┘ │  ┌─────────────────────────────────┐ │
│                          │  │ 📋 History of Present Illness   │ │
│  ┌────────────────────┐ │  │                                 │ │
│  │                    │ │  │ [Auto-updating content]         │ │
│  │ 👤 Patient         │ │  │                                 │ │
│  │ 00:18              │ │  │                                 │ │
│  │                    │ │  └─────────────────────────────────┘ │
│  │ "I've been having  │ │                                       │
│  │ chest pain for     │ │  ┌─────────────────────────────────┐ │
│  │ the past two       │ │  │ 🎯 Assessment                   │ │
│  │ days..."           │ │  │                                 │ │
│  │                    │ │  │ • Possible diagnoses...         │ │
│  └────────────────────┘ │  │                                 │ │
│                          │  └─────────────────────────────────┘ │
│  [Transcript continues   │                                       │
│   with smooth scroll]    │  [Documentation updates in          │
│                          │   real-time as conversation         │
│                          │   progresses]                        │
│                          │                                       │
└──────────────────────────┴──────────────────────────────────────┘
```

### 3. Session Review/Edit View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Sessions                                                       │
│                                                                   │
│  Session from Oct 3, 2025 • 15:23 • Duration: 12:45             │
│  Patient Context: Follow-up visit                                │
│                                                                   │
│  [📥 Export] [📋 Copy] [🗑️ Delete]        [✅ Finalize Note]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Tab: SOAP Note] [Tab: Full Transcript] [Tab: Entities]        │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  📝 SOAP Note                                              │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Subjective                                  [✏️ Edit] │  │  │
│  │  │                                                       │  │  │
│  │  │ Chief Complaint:                                     │  │  │
│  │  │ Patient reports chest pain for 2 days...            │  │  │
│  │  │                                                       │  │  │
│  │  │ History of Present Illness:                          │  │  │
│  │  │ 45-year-old male presents with...                   │  │  │
│  │  │ [Editable rich text with formatting]                │  │  │
│  │  │                                                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Objective                                   [✏️ Edit] │  │  │
│  │  │                                                       │  │  │
│  │  │ Vital Signs:                                         │  │  │
│  │  │ • BP: 130/85 mmHg                                    │  │  │
│  │  │ • HR: 78 bpm                                         │  │  │
│  │  │ • Temp: 98.6°F                                       │  │  │
│  │  │                                                       │  │  │
│  │  │ Physical Exam:                                       │  │  │
│  │  │ [Editable content...]                                │  │  │
│  │  │                                                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  [Assessment and Plan sections continue...]                │  │
│  │                                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  💡 AI Suggestions                                               │
│  • Consider adding differential diagnoses                        │
│  • Review medication dosages                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Session History / Library View

```
┌─────────────────────────────────────────────────────────────────┐
│  ☰ Medical Scribe                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Session History                                                 │
│                                                                   │
│  [🔍 Search sessions...]                                         │
│                                                                   │
│  Filters: [All] [Today] [This Week] [This Month]                │
│  Sort by: [Most Recent ▼]                                        │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📋 Follow-up Visit                          Oct 3, 2025   │  │
│  │                                                             │  │
│  │ Duration: 12:45  •  Status: ✅ Finalized                   │  │
│  │ Patient: [***]  •  Visit Type: Follow-up                   │  │
│  │                                                             │  │
│  │ "Patient reports improvement in symptoms..."               │  │
│  │                                                             │  │
│  │ [View] [Export] [Delete]                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📋 Initial Consultation                     Oct 2, 2025   │  │
│  │                                                             │  │
│  │ Duration: 18:32  •  Status: ⏸️ Draft                       │  │
│  │ Patient: [***]  •  Visit Type: New Patient                 │  │
│  │                                                             │  │
│  │ "New patient presenting with chronic pain..."              │  │
│  │                                                             │  │
│  │ [Continue] [View] [Delete]                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [Load More...]                                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key UI Components

1. **DashboardView**: Home screen with quick access and stats
2. **SessionCard**: Card component for session previews with status badges
3. **RecordingControls**: Floating control bar with prominent pause/stop buttons
4. **AudioVisualizer**: Real-time waveform visualization during recording
5. **TranscriptPanel**: Scrollable transcript with speaker avatars and timestamps
6. **DocumentationPanel**: Tabbed interface for SOAP notes, summaries, and entities
7. **EditableSection**: Rich text editor for documentation sections with inline editing
8. **SessionHeader**: Breadcrumb navigation and session metadata
9. **ExportModal**: Multi-format export options (PDF, DOCX, TXT, JSON)
10. **SearchBar**: Global search across all sessions
11. **FilterBar**: Quick filters for session status and date ranges
12. **StatsCards**: Dashboard metrics with icons and trends
13. **SpeakerBubble**: Chat-like bubbles for transcript segments
14. **AIBadge**: Indicator for AI-generated content with confidence scores
15. **ToastNotifications**: Non-intrusive notifications for auto-save, errors, etc.

### Interaction Patterns

**Recording Flow**:
- Large, centered "Start New Session" button on dashboard
- Smooth transition to recording view
- Pulsing red indicator during active recording
- Real-time audio waveform visualization
- Floating control bar that stays accessible while scrolling

**Real-time Updates**:
- Transcript appears with smooth fade-in animations
- Documentation sections update with subtle highlight effect
- Auto-scroll transcript to latest content
- Typing indicators when AI is processing

**Editing Experience**:
- Click any section to enter edit mode
- Inline editing with rich text formatting
- Auto-save with visual confirmation
- Undo/redo support
- Side-by-side view of transcript and notes

**Navigation**:
- Persistent sidebar for quick navigation
- Breadcrumb trail for context
- Keyboard shortcuts for power users
- Smooth page transitions

### Responsive Design

**Desktop (1024px+)**:
- Two-column layout for transcript and documentation
- Sidebar navigation always visible
- Rich hover states and tooltips

**Tablet (768px - 1023px)**:
- Collapsible sidebar
- Tabbed interface for transcript/documentation
- Touch-optimized controls

**Mobile (< 768px)**:
- Single column layout
- Bottom navigation bar
- Swipe gestures for navigation
- Simplified recording controls
- Full-screen recording mode

## Data Flow

### Session Creation and Recording Flow

```
User clicks "New Session"
  → SessionManager.createSession()
  → StorageService.saveSession()
  → UI displays session view
  → User clicks "Start Recording"
  → RecordingManager.startRecording()
  → Audio data flows to TranscriptionService
  → TranscriptSegments generated in real-time
  → Segments added to Session.transcript
  → DocumentationGenerator.updateDocumentation()
  → UI updates with new documentation
  → User clicks "Stop"
  → RecordingManager.stopRecording()
  → Final documentation generated
  → Session status set to 'completed'
```

### Real-time Documentation Update Flow

```
New TranscriptSegment received
  → SessionManager receives segment
  → Segment added to session transcript
  → StorageService.updateSession() (auto-save)
  → DocumentationGenerator.updateDocumentation()
    → Extract clinical entities from new segment
    → Update relevant SOAP sections
    → Maintain context from previous segments
  → Updated documentation returned
  → UI re-renders with new content
```

## Error Handling

### Microphone Access Errors
- Display clear error message if microphone permission denied
- Provide instructions for enabling microphone access
- Offer alternative: upload pre-recorded audio (future enhancement)

### Transcription Errors
- Implement retry logic with exponential backoff
- Fall back to Web Speech API if cloud service fails
- Display warning to user if transcription quality is low
- Allow manual transcript editing

### AI Service Errors
- Cache partial documentation to prevent data loss
- Retry failed API calls with rate limiting
- Display error state in documentation panel
- Allow manual documentation entry as fallback

### Storage Errors
- Implement error recovery for IndexedDB failures
- Provide data export before clearing storage
- Display clear error messages for storage quota issues

### Network Errors
- Queue API requests when offline (if applicable)
- Display connection status indicator
- Implement graceful degradation for offline mode

## Testing Strategy

### Unit Testing
- Test individual services in isolation (RecordingManager, TranscriptionService, etc.)
- Mock external dependencies (APIs, browser APIs)
- Test data models and transformations
- Test utility functions and helpers
- Target: 80%+ code coverage for business logic

### Integration Testing
- Test service interactions (SessionManager coordinating multiple services)
- Test data flow from recording to documentation
- Test storage operations with real IndexedDB
- Test error handling across service boundaries

### Component Testing
- Test React components with React Testing Library
- Test user interactions (button clicks, form inputs)
- Test component state management
- Test conditional rendering and error states

### End-to-End Testing
- Test complete user workflows (create session, record, review, export)
- Test real-time updates and state synchronization
- Test browser compatibility (Chrome, Firefox, Safari, Edge)
- Test responsive design on different screen sizes

### Manual Testing
- Test with real audio input and medical conversations
- Verify transcription accuracy with medical terminology
- Validate generated documentation quality
- Test accessibility with screen readers
- Performance testing with long sessions

## Security and Privacy Considerations

### Data Handling
- Process audio locally when possible to minimize data transmission
- Implement secure API communication (HTTPS only)
- Clear sensitive data from memory after processing
- Provide option to disable cloud processing for sensitive cases

### Access Control
- Implement session timeout for inactive users
- Require re-authentication for sensitive operations
- Provide secure session storage with encryption (future enhancement)

### Compliance Considerations
- Design with HIPAA compliance principles in mind
- Implement audit logging for data access (future enhancement)
- Provide data deletion capabilities
- Include privacy policy and terms of service

### Data Retention
- Implement configurable data retention policies
- Provide bulk data deletion options
- Clear temporary data after session completion
- Implement secure data export before deletion

## Performance Optimization

### Audio Processing
- Use Web Workers for audio processing to avoid blocking UI
- Implement efficient audio chunking for real-time transcription
- Optimize memory usage for long recording sessions

### AI Processing
- Batch transcript segments to reduce API calls
- Implement intelligent update triggers (don't update on every word)
- Cache AI responses to avoid redundant processing
- Use streaming responses when available

### Storage
- Implement efficient IndexedDB queries with proper indexing
- Compress large transcript data before storage
- Implement pagination for session lists
- Clean up old sessions automatically

### UI Performance
- Implement virtual scrolling for long transcripts
- Debounce real-time updates to reduce re-renders
- Use React.memo and useMemo for expensive computations
- Lazy load components and routes

## Future Enhancements

1. **Multi-language Support**: Transcription and documentation in multiple languages
2. **Custom Templates**: Allow providers to create custom documentation templates
3. **Voice Commands**: Control recording with voice commands
4. **Integration**: Export to EHR systems (HL7 FHIR)
5. **Collaboration**: Multi-provider sessions with role identification
6. **Analytics**: Session analytics and documentation quality metrics
7. **Offline Mode**: Full offline capability with sync when online
8. **Mobile Apps**: Native iOS and Android applications
