// Jest setup file for testing environment

import type { Session } from './models/types';

// Mock IndexedDB for testing
import 'fake-indexeddb/auto';

// Mock Web Audio API for recording tests
Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    state: 'inactive',
    stream: null,
    mimeType: 'audio/webm',
    ondataavailable: null,
    onerror: null,
    onpause: null,
    onresume: null,
    onstart: null,
    onstop: null
  }))
});

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [
        {
          stop: jest.fn(),
          getSettings: () => ({ deviceId: 'mock-device' })
        }
      ]
    })
  }
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue('')
  }
});

// Mock storage estimate API
Object.defineProperty(navigator, 'storage', {
  writable: true,
  value: {
    estimate: jest.fn().mockResolvedValue({
      usage: 1024 * 1024, // 1MB
      quota: 1024 * 1024 * 1024 // 1GB
    })
  }
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob constructor
global.Blob = jest.fn().mockImplementation((content, options) => ({
  size: content ? content.join('').length : 0,
  type: options?.type || '',
  text: jest.fn().mockResolvedValue(content ? content.join('') : ''),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  stream: jest.fn(),
  slice: jest.fn()
}));

// Suppress console warnings in tests unless explicitly testing them
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

const globalAny = globalThis as typeof globalThis & {
  createMockSession: (overrides?: Partial<Session>) => Session;
};

// Global test utilities
globalAny.createMockSession = (overrides = {}) => ({
  id: 'test-session-1',
  createdAt: new Date('2025-01-01T10:00:00Z'),
  updatedAt: new Date('2025-01-01T10:30:00Z'),
  status: 'completed',
  patientContext: {
    identifier: 'patient-123',
    visitType: 'follow-up'
  },
  transcript: [
    {
      id: 'segment-1',
      timestamp: 60,
      speaker: 'provider',
      text: 'How are you feeling today?',
      confidence: 0.95
    }
  ],
  documentation: {
    soapNote: {
      subjective: {
        chiefComplaint: 'Follow-up visit'
      },
      objective: {},
      assessment: {
        diagnoses: ['Hypertension, controlled']
      },
      plan: {}
    },
    clinicalEntities: [],
    lastUpdated: new Date('2025-01-01T10:30:00Z'),
    isFinalized: true
  },
  metadata: {
    duration: 1800,
    processingStatus: 'completed'
  },
  ...overrides
});

// Add custom matchers if needed
expect.extend({
  toBeValidSession(received) {
    const pass = received && 
                 typeof received.id === 'string' &&
                 received.createdAt instanceof Date &&
                 received.updatedAt instanceof Date &&
                 ['active', 'paused', 'completed'].includes(received.status);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid session`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid session`,
        pass: false
      };
    }
  }
});
