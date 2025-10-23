import { StorageService } from '../StorageService';
import { Session } from "../../models/types";
// Unused imports removed
import * as database from '../database';

// Mock the database module
jest.mock('../database', () => ({
  getDatabase: jest.fn(),
  createTransaction: jest.fn(),
  handleDatabaseError: jest.fn(),
  STORES: { SESSIONS: 'sessions' },
  INDEXES: {
    SESSIONS: {
      BY_STATUS: 'by_status',
      BY_CREATED_DATE: 'by_created_date',
      BY_PATIENT_ID: 'by_patient_id'
    }
  }
}));

// Mock IndexedDB
const mockObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  count: jest.fn(),
  index: jest.fn()
};

const mockIndex = {
  getAll: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
  onerror: null,
  onabort: null
};

const mockDatabase = {
  transaction: jest.fn(() => mockTransaction)
};

describe('StorageService', () => {
  let storageService: StorageService;
  let mockSession: Session;

  beforeEach(() => {
    storageService = new StorageService();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (database.getDatabase as jest.Mock).mockResolvedValue(mockDatabase);
    (database.createTransaction as jest.Mock).mockReturnValue(mockTransaction);
    (database.handleDatabaseError as jest.Mock).mockImplementation((error, operation) => 
      new Error(`${operation}: ${error.message}`)
    );

    mockObjectStore.index.mockReturnValue(mockIndex);

    // Create a mock session for testing
    mockSession = {
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
        },
        {
          id: 'segment-2',
          timestamp: 65,
          speaker: 'patient',
          text: 'I am feeling much better.',
          confidence: 0.92
        }
      ],
      documentation: {
        soapNote: {
          subjective: {
            chiefComplaint: 'Follow-up visit',
            historyOfPresentIllness: 'Patient reports improvement'
          },
          objective: {
            vitalSigns: {
              bloodPressure: '120/80',
              heartRate: 72
            }
          },
          assessment: {
            diagnoses: ['Hypertension, controlled']
          },
          plan: {
            medications: [{
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'daily'
            }]
          }
        },
        clinicalEntities: [
          {
            type: 'medication',
            value: 'Lisinopril',
            confidence: 0.98
          }
        ],
        lastUpdated: new Date('2025-01-01T10:30:00Z'),
        isFinalized: true
      },
      metadata: {
        duration: 1800,
        processingStatus: 'completed'
      }
    };
  });

  describe('saveSession', () => {
    it('should save a valid session successfully', async () => {
      // Setup mock to simulate successful save
      mockObjectStore.put.mockImplementation((data) => ({
        onsuccess: null,
        onerror: null,
        result: data
      }));

      // Simulate successful transaction
      setTimeout(() => {
        const putRequest = mockObjectStore.put.mock.results[0].value;
        if (putRequest.onsuccess) putRequest.onsuccess();
      }, 0);

      await expect(storageService.saveSession(mockSession)).resolves.toBeUndefined();
      
      expect(database.getDatabase).toHaveBeenCalled();
      expect(database.createTransaction).toHaveBeenCalledWith(mockDatabase, 'sessions', 'readwrite');
      expect(mockObjectStore.put).toHaveBeenCalled();
      
      // Verify that dates were converted to ISO strings for storage
      const savedData = mockObjectStore.put.mock.calls[0][0];
      expect(typeof savedData.createdAt).toBe('string');
      expect(typeof savedData.updatedAt).toBe('string');
      expect(typeof savedData.documentation.lastUpdated).toBe('string');
    });

    it('should reject invalid session data', async () => {
      const invalidSession = { ...mockSession, id: '' }; // Invalid: empty ID

      await expect(storageService.saveSession(invalidSession as Session))
        .rejects.toThrow('Invalid session data');
    });

    it('should handle database errors during save', async () => {
      const dbError = new Error('Database connection failed');
      (database.getDatabase as jest.Mock).mockRejectedValue(dbError);

      await expect(storageService.saveSession(mockSession))
        .rejects.toThrow('saveSession: Database connection failed');
    });

    it('should handle transaction errors during save', async () => {
      mockObjectStore.put.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        error: new Error('Transaction failed')
      }));

      setTimeout(() => {
        const putRequest = mockObjectStore.put.mock.results[0].value;
        if (putRequest.onerror) putRequest.onerror();
      }, 0);

      await expect(storageService.saveSession(mockSession))
        .rejects.toThrow();
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const storedSession = {
        ...mockSession,
        createdAt: mockSession.createdAt.toISOString(),
        updatedAt: mockSession.updatedAt.toISOString(),
        documentation: {
          ...mockSession.documentation,
          lastUpdated: mockSession.documentation.lastUpdated.toISOString()
        }
      };

      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: storedSession
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const result = await storageService.getSession('test-session-1');
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('test-session-1');
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(result?.documentation.lastUpdated).toBeInstanceOf(Date);
      expect(mockObjectStore.get).toHaveBeenCalledWith('test-session-1');
    });

    it('should return null for non-existent session', async () => {
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: undefined
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const result = await storageService.getSession('non-existent-id');
      expect(result).toBeNull();
    });

    it('should reject invalid session ID', async () => {
      await expect(storageService.getSession(''))
        .rejects.toThrow('Session ID is required and must be a string');
      
      await expect(storageService.getSession(null as any))
        .rejects.toThrow('Session ID is required and must be a string');
    });

    it('should handle database errors during get', async () => {
      const dbError = new Error('Database error');
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        error: dbError
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onerror) getRequest.onerror();
      }, 0);

      await expect(storageService.getSession('test-id'))
        .rejects.toThrow();
    });
  });

  describe('getAllSessions', () => {
    it('should retrieve all sessions', async () => {
      const storedSessions = [
        {
          ...mockSession,
          createdAt: mockSession.createdAt.toISOString(),
          updatedAt: mockSession.updatedAt.toISOString(),
          documentation: {
            ...mockSession.documentation,
            lastUpdated: mockSession.documentation.lastUpdated.toISOString()
          }
        }
      ];

      mockObjectStore.getAll.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: storedSessions
      }));

      setTimeout(() => {
        const getAllRequest = mockObjectStore.getAll.mock.results[0].value;
        if (getAllRequest.onsuccess) getAllRequest.onsuccess();
      }, 0);

      const result = await storageService.getAllSessions();
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-session-1');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array when no sessions exist', async () => {
      mockObjectStore.getAll.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: []
      }));

      setTimeout(() => {
        const getAllRequest = mockObjectStore.getAll.mock.results[0].value;
        if (getAllRequest.onsuccess) getAllRequest.onsuccess();
      }, 0);

      const result = await storageService.getAllSessions();
      expect(result).toEqual([]);
    });
  });

  describe('updateSession', () => {
    it('should update an existing session', async () => {
      // Mock getting existing session
      const storedSession = {
        ...mockSession,
        createdAt: mockSession.createdAt.toISOString(),
        updatedAt: mockSession.updatedAt.toISOString(),
        documentation: {
          ...mockSession.documentation,
          lastUpdated: mockSession.documentation.lastUpdated.toISOString()
        }
      };

      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: storedSession
      }));

      mockObjectStore.put.mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
        
        const putRequest = mockObjectStore.put.mock.results[0].value;
        if (putRequest.onsuccess) putRequest.onsuccess();
      }, 0);

      const updates = { status: 'completed' as const };
      await storageService.updateSession('test-session-1', updates);

      expect(mockObjectStore.get).toHaveBeenCalledWith('test-session-1');
      expect(mockObjectStore.put).toHaveBeenCalled();
      
      const updatedSession = mockObjectStore.put.mock.calls[0][0];
      expect(updatedSession.status).toBe('completed');
      expect(new Date(updatedSession.updatedAt).getTime()).toBeGreaterThan(
        new Date(storedSession.updatedAt).getTime()
      );
    });

    it('should reject update for non-existent session', async () => {
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: undefined
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      await expect(storageService.updateSession('non-existent', { status: 'completed' }))
        .rejects.toThrow('Session with ID non-existent not found');
    });

    it('should prevent ID changes during update', async () => {
      const storedSession = {
        ...mockSession,
        createdAt: mockSession.createdAt.toISOString(),
        updatedAt: mockSession.updatedAt.toISOString(),
        documentation: {
          ...mockSession.documentation,
          lastUpdated: mockSession.documentation.lastUpdated.toISOString()
        }
      };

      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: storedSession
      }));

      mockObjectStore.put.mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
        
        const putRequest = mockObjectStore.put.mock.results[0].value;
        if (putRequest.onsuccess) putRequest.onsuccess();
      }, 0);

      await storageService.updateSession('test-session-1', { id: 'different-id' } as any);

      const updatedSession = mockObjectStore.put.mock.calls[0][0];
      expect(updatedSession.id).toBe('test-session-1'); // ID should remain unchanged
    });
  });

  describe('deleteSession', () => {
    it('should delete an existing session', async () => {
      mockObjectStore.delete.mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      }));

      setTimeout(() => {
        const deleteRequest = mockObjectStore.delete.mock.results[0].value;
        if (deleteRequest.onsuccess) deleteRequest.onsuccess();
      }, 0);

      await storageService.deleteSession('test-session-1');
      expect(mockObjectStore.delete).toHaveBeenCalledWith('test-session-1');
    });

    it('should reject invalid session ID for deletion', async () => {
      await expect(storageService.deleteSession(''))
        .rejects.toThrow('Session ID is required and must be a string');
    });
  });

  describe('clearAllSessions', () => {
    it('should clear all sessions', async () => {
      mockObjectStore.clear.mockImplementation(() => ({
        onsuccess: null,
        onerror: null
      }));

      setTimeout(() => {
        const clearRequest = mockObjectStore.clear.mock.results[0].value;
        if (clearRequest.onsuccess) clearRequest.onsuccess();
      }, 0);

      await storageService.clearAllSessions();
      expect(mockObjectStore.clear).toHaveBeenCalled();
    });
  });

  describe('getSessionsByStatus', () => {
    it('should retrieve sessions by status using index', async () => {
      const storedSessions = [mockSession];
      
      mockIndex.getAll.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: storedSessions.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          documentation: {
            ...s.documentation,
            lastUpdated: s.documentation.lastUpdated.toISOString()
          }
        }))
      }));

      setTimeout(() => {
        const getAllRequest = mockIndex.getAll.mock.results[0].value;
        if (getAllRequest.onsuccess) getAllRequest.onsuccess();
      }, 0);

      const result = await storageService.getSessionsByStatus('completed');
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
      expect(mockObjectStore.index).toHaveBeenCalledWith('by_status');
      expect(mockIndex.getAll).toHaveBeenCalledWith('completed');
    });
  });

  describe('getSessionCount', () => {
    it('should return the total count of sessions', async () => {
      mockObjectStore.count.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: 5
      }));

      setTimeout(() => {
        const countRequest = mockObjectStore.count.mock.results[0].value;
        if (countRequest.onsuccess) countRequest.onsuccess();
      }, 0);

      const count = await storageService.getSessionCount();
      expect(count).toBe(5);
      expect(mockObjectStore.count).toHaveBeenCalled();
    });
  });

  describe('sessionExists', () => {
    it('should return true for existing session', async () => {
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: mockSession
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const exists = await storageService.sessionExists('test-session-1');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: undefined
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const exists = await storageService.sessionExists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('export functionality', () => {
    it('should export a session in JSON format', async () => {
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: {
          ...mockSession,
          createdAt: mockSession.createdAt.toISOString(),
          updatedAt: mockSession.updatedAt.toISOString(),
          documentation: {
            ...mockSession.documentation,
            lastUpdated: mockSession.documentation.lastUpdated.toISOString()
          }
        }
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const blob = await storageService.exportSession('test-session-1', 'json');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      
      const text = await blob.text();
      const parsed = JSON.parse(text);
      expect(parsed.id).toBe('test-session-1');
    });

    it('should export a session in text format', async () => {
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: {
          ...mockSession,
          createdAt: mockSession.createdAt.toISOString(),
          updatedAt: mockSession.updatedAt.toISOString(),
          documentation: {
            ...mockSession.documentation,
            lastUpdated: mockSession.documentation.lastUpdated.toISOString()
          }
        }
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      const blob = await storageService.exportSession('test-session-1', 'text');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
      
      const text = await blob.text();
      expect(text).toContain('MEDICAL SCRIBE SESSION REPORT');
      expect(text).toContain('test-session-1');
    });

    it('should reject export for non-existent session', async () => {
      mockObjectStore.get.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: undefined
      }));

      setTimeout(() => {
        const getRequest = mockObjectStore.get.mock.results[0].value;
        if (getRequest.onsuccess) getRequest.onsuccess();
      }, 0);

      await expect(storageService.exportSession('non-existent', 'json'))
        .rejects.toThrow('Session with ID non-existent not found');
    });
  });

  describe('error handling', () => {
    it('should handle database connection failures', async () => {
      const connectionError = new Error('Failed to connect to database');
      (database.getDatabase as jest.Mock).mockRejectedValue(connectionError);

      await expect(storageService.getAllSessions())
        .rejects.toThrow('getAllSessions: Failed to connect to database');
    });

    it('should handle transaction failures', async () => {
      mockTransaction.onerror = jest.fn();
      
      const transactionError = new Error('Transaction failed');
      mockObjectStore.put.mockImplementation(() => {
        throw transactionError;
      });

      await expect(storageService.saveSession(mockSession))
        .rejects.toThrow();
    });
  });
});