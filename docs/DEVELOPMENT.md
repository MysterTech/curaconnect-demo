# Development Documentation

This document provides comprehensive information for developers working on the Medical Scribe AI application.

## 📚 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Code Organization](#code-organization)
- [API Documentation](#api-documentation)
- [Component Documentation](#component-documentation)
- [Service Documentation](#service-documentation)
- [Utility Documentation](#utility-documentation)
- [Testing Guidelines](#testing-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Security Guidelines](#security-guidelines)
- [Accessibility Guidelines](#accessibility-guidelines)

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│     Layer       │    │     Logic       │    │     Layer       │
│                 │    │     Layer       │    │                 │
│ • React Pages   │◄──►│ • Services      │◄──►│ • IndexedDB     │
│ • Components    │    │ • Managers      │    │ • Memory Cache  │
│ • Hooks         │    │ • Controllers   │    │ • External APIs │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **User Interaction** → React Components
2. **Component Events** → Custom Hooks
3. **Hook Actions** → Service Layer
4. **Service Operations** → Data Layer
5. **Data Updates** → State Management
6. **State Changes** → Component Re-render

### Key Design Patterns

- **Service Layer Pattern**: Business logic separated from UI components
- **Repository Pattern**: Data access abstraction through StorageService
- **Observer Pattern**: Event-driven updates for real-time features
- **Factory Pattern**: Dynamic component and service creation
- **Singleton Pattern**: Shared service instances

## 📁 Code Organization

### Directory Structure

```
src/
├── components/           # UI Components
│   ├── animations/      # Animation utilities and components
│   ├── common/          # Reusable UI components
│   ├── documentation/   # Documentation-specific components
│   ├── export/          # Export functionality
│   ├── layout/          # Layout components
│   ├── recording/       # Recording-related components
│   ├── search/          # Search and filter components
│   ├── sessions/        # Session management components
│   └── transcript/      # Transcript display components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── models/              # TypeScript interfaces and types
├── pages/               # Main application pages
├── services/            # Business logic services
├── utils/               # Utility functions and helpers
└── __tests__/           # Test files
```

### Naming Conventions

- **Components**: PascalCase (e.g., `SessionCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSession.ts`)
- **Services**: PascalCase with descriptive suffix (e.g., `StorageService.ts`)
- **Utilities**: camelCase (e.g., `validation.ts`)
- **Types**: PascalCase (e.g., `Session`, `TranscriptSegment`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

## 🔌 API Documentation

### Core Services

#### StorageService

Handles all data persistence operations using IndexedDB.

```typescript
interface StorageServiceInterface {
  saveSession(session: Session): Promise<void>;
  getSession(sessionId: string): Promise<Session | null>;
  getAllSessions(): Promise<Session[]>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  getSessionsByFilter(filter: SessionFilter): Promise<Session[]>;
  searchSessions(query: string): Promise<Session[]>;
}
```

**Key Methods:**
- `saveSession()`: Persists session data with validation
- `getSession()`: Retrieves session by ID with caching
- `searchSessions()`: Full-text search across session content
- `getSessionsByFilter()`: Filtered session retrieval with indexing

#### SessionManager

Orchestrates session lifecycle and coordinates between services.

```typescript
interface SessionManagerInterface {
  createSession(patientContext?: PatientContext): Promise<Session>;
  startSession(sessionId: string): Promise<void>;
  pauseSession(sessionId: string): Promise<void>;
  resumeSession(sessionId: string): Promise<void>;
  stopSession(sessionId: string): Promise<void>;
  finalizeSession(sessionId: string): Promise<void>;
}
```

**Key Features:**
- Real-time transcription coordination
- Auto-save functionality
- Session state management
- Error handling and recovery

#### RecordingManager

Manages audio recording using Web Audio API.

```typescript
interface RecordingManagerInterface {
  startRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  getAudioLevel(): number;
}
```

**Audio Processing:**
- Real-time audio level monitoring
- Configurable sample rates and formats
- Voice activity detection
- Audio chunking for streaming

#### TranscriptionService

Handles speech-to-text conversion using OpenAI Whisper.

```typescript
interface TranscriptionServiceInterface {
  transcribeAudio(audioBlob: Blob): Promise<TranscriptSegment[]>;
  transcribeStream(audioStream: MediaStream): Promise<void>;
  setLanguage(language: string): void;
  enableSpeakerDiarization(enabled: boolean): void;
}
```

**Features:**
- Real-time streaming transcription
- Speaker diarization
- Multiple language support
- Confidence scoring

#### DocumentationGenerator

AI-powered clinical documentation generation.

```typescript
interface DocumentationGeneratorInterface {
  generateSOAPNote(transcript: TranscriptSegment[]): Promise<SOAPNote>;
  extractClinicalEntities(text: string): Promise<ClinicalEntities>;
  updateDocumentation(sessionId: string, updates: Partial<Documentation>): Promise<void>;
  generateSummary(session: Session): Promise<string>;
}
```

**AI Features:**
- SOAP note generation
- Clinical entity extraction
- Real-time documentation updates
- Confidence scoring and validation

## 🧩 Component Documentation

### Core Components

#### SessionCard

Displays session information in a card format.

```typescript
interface SessionCardProps {
  session: Session;
  onClick?: (session: Session) => void;
  onEdit?: (session: Session) => void;
  onDelete?: (session: Session) => void;
  showActions?: boolean;
  compact?: boolean;
}
```

**Features:**
- Responsive design
- Action buttons (edit, delete, export)
- Status indicators
- Hover animations

#### RecordingControls

Audio recording control interface.

```typescript
interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}
```

**Features:**
- Visual recording indicators
- Real-time duration display
- Audio level visualization
- Keyboard shortcuts

#### TranscriptPanel

Real-time transcript display with speaker identification.

```typescript
interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  isLive?: boolean;
  showTimestamps?: boolean;
  showSpeakers?: boolean;
  onSegmentClick?: (segment: TranscriptSegment) => void;
}
```

**Features:**
- Auto-scrolling to latest content
- Speaker color coding
- Timestamp display
- Search highlighting

#### DocumentationPanel

SOAP note display and editing interface.

```typescript
interface DocumentationPanelProps {
  documentation: Documentation;
  isEditable?: boolean;
  onUpdate?: (updates: Partial<Documentation>) => void;
  showConfidenceScores?: boolean;
}
```

**Features:**
- Tabbed SOAP sections
- Inline editing
- Confidence indicators
- Auto-save functionality

### Utility Components

#### LoadingSpinner

Configurable loading indicator.

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  className?: string;
}
```

#### ErrorBoundary

React error boundary for graceful error handling.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

## 🔧 Service Documentation

### Service Architecture

Services follow a layered architecture:

1. **Controller Layer**: Handles user interactions and coordinates services
2. **Service Layer**: Contains business logic and data processing
3. **Repository Layer**: Manages data access and persistence
4. **Utility Layer**: Provides common functionality and helpers

### Service Interfaces

All services implement well-defined interfaces to ensure consistency and testability.

```typescript
// Base service interface
interface BaseService {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  isInitialized(): boolean;
}

// Service with event handling
interface EventEmittingService extends BaseService {
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, ...args: any[]): void;
}
```

### Error Handling

Services use a consistent error handling pattern:

```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public service: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Usage in services
try {
  await someOperation();
} catch (error) {
  throw new ServiceError(
    'Operation failed',
    'OPERATION_FAILED',
    'ServiceName',
    error
  );
}
```

## 🛠️ Utility Documentation

### Validation Utilities

```typescript
// Session validation
export const validateSession = (session: Session): string[] => {
  const errors: string[] = [];
  
  if (!session.id) errors.push('Session ID is required');
  if (!session.createdAt) errors.push('Created date is required');
  // ... more validations
  
  return errors;
};

// Data transformation utilities
export const transformSessionForExport = (
  session: Session,
  format: ExportFormat
): string => {
  // Transform session data based on export format
};
```

### Performance Utilities

```typescript
// Debouncing for frequent updates
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  // Implementation
};

// Memoization for expensive computations
export const memoize = <T extends (...args: any[]) => any>(
  func: T
): T => {
  // Implementation
};
```

### Security Utilities

```typescript
// Data sanitization
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>\"'&]/g, '');
};

// Secure storage
export class SecureStorage {
  static async setItem(key: string, value: string): Promise<void> {
    // Encrypted storage implementation
  }
  
  static async getItem(key: string): Promise<string | null> {
    // Decrypted retrieval implementation
  }
}
```

## 🧪 Testing Guidelines

### Testing Strategy

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Service interactions and workflows
3. **E2E Tests**: Complete user workflows
4. **Accessibility Tests**: WCAG compliance verification

### Test Structure

```typescript
// Component test example
describe('SessionCard', () => {
  const mockSession: Session = {
    // Mock data
  };

  beforeEach(() => {
    // Setup
  });

  it('should render session information', () => {
    render(<SessionCard session={mockSession} />);
    expect(screen.getByText(mockSession.id)).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<SessionCard session={mockSession} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockSession);
  });
});
```

### Mocking Guidelines

```typescript
// Service mocking
jest.mock('../services/StorageService', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    saveSession: jest.fn().mockResolvedValue(undefined),
    getSession: jest.fn().mockResolvedValue(mockSession),
  }))
}));

// API mocking
const mockFetch = jest.fn();
global.fetch = mockFetch;
```

## ⚡ Performance Guidelines

### Optimization Strategies

1. **Code Splitting**: Lazy load components and routes
2. **Memoization**: Cache expensive computations
3. **Virtual Scrolling**: Handle large lists efficiently
4. **Debouncing**: Limit frequent operations
5. **Caching**: Store frequently accessed data

### Performance Monitoring

```typescript
// Performance measurement
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
};

// Memory usage monitoring
const logMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      total: Math.round(memory.totalJSHeapSize / 1048576),
    });
  }
};
```

### Bundle Optimization

- Use dynamic imports for code splitting
- Implement tree shaking for unused code elimination
- Optimize images and assets
- Use compression for production builds

## 🔒 Security Guidelines

### Data Protection

1. **Input Validation**: Sanitize all user inputs
2. **Output Encoding**: Encode data for display
3. **Secure Storage**: Encrypt sensitive data at rest
4. **Access Control**: Implement proper authentication
5. **Audit Logging**: Track sensitive operations

### Security Best Practices

```typescript
// Input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"'&]/g, '')
    .trim()
    .substring(0, MAX_INPUT_LENGTH);
};

// Secure API calls
const makeSecureRequest = async (url: string, data: any) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSecureToken()}`,
    },
    body: JSON.stringify(sanitizeRequestData(data)),
  });
  
  if (!response.ok) {
    throw new SecurityError('Request failed security validation');
  }
  
  return response.json();
};
```

## ♿ Accessibility Guidelines

### WCAG 2.1 Compliance

The application follows WCAG 2.1 AA guidelines:

1. **Perceivable**: Content is presentable to users in ways they can perceive
2. **Operable**: Interface components are operable by all users
3. **Understandable**: Information and UI operation are understandable
4. **Robust**: Content is robust enough for various assistive technologies

### Implementation Guidelines

```typescript
// Accessible component example
const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}> = ({ children, onClick, ariaLabel, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      {children}
    </button>
  );
};

// Screen reader announcements
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

### Keyboard Navigation

All interactive elements support keyboard navigation:

- **Tab**: Navigate between focusable elements
- **Enter/Space**: Activate buttons and controls
- **Arrow Keys**: Navigate within components
- **Escape**: Close modals and dropdowns

### Screen Reader Support

- Proper ARIA labels and roles
- Live regions for dynamic content
- Descriptive text for complex interactions
- Logical heading hierarchy

---

This documentation is continuously updated as the codebase evolves. For the most current information, refer to the inline code comments and TypeScript interfaces.