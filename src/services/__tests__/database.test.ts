import {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  deleteDatabase,
  isIndexedDBSupported,
  getStorageInfo,
  handleDatabaseError,
  validateDatabaseIntegrity,
  DB_NAME,
  DB_VERSION,
  STORES,
  INDEXES
} from '../database';

// Mock IndexedDB
const mockObjectStore = {
  createIndex: jest.fn(),
  deleteObjectStore: jest.fn()
};

const mockDatabase = {
  createObjectStore: jest.fn(() => mockObjectStore),
  deleteObjectStore: jest.fn(),
  objectStoreNames: {
    contains: jest.fn()
  },
  close: jest.fn(),
  onclose: null,
  onversionchange: null
};

const mockOpenRequest = {
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
  result: mockDatabase,
  error: null
};

const mockDeleteRequest = {
  onsuccess: null,
  onerror: null,
  onblocked: null,
  error: null
};

// Mock global IndexedDB
Object.defineProperty(global, 'indexedDB', {
  writable: true,
  value: {
    open: jest.fn(() => mockOpenRequest),
    deleteDatabase: jest.fn(() => mockDeleteRequest)
  }
});

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase.objectStoreNames.contains.mockReturnValue(false);
  });

  describe('isIndexedDBSupported', () => {
    it('should return true when IndexedDB is available', () => {
      expect(isIndexedDBSupported()).toBe(true);
    });

    it('should return false when IndexedDB is not available', () => {
      const originalIndexedDB = global.indexedDB;
      delete (global as any).indexedDB;
      
      expect(isIndexedDBSupported()).toBe(false);
      
      global.indexedDB = originalIndexedDB;
    });
  });

  describe('initializeDatabase', () => {
    it('should initialize database successfully', async () => {
      const dbPromise = initializeDatabase();
      
      // Simulate successful database opening
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess();
        }
      }, 0);

      const db = await dbPromise;
      
      expect(indexedDB.open).toHaveBeenCalledWith(DB_NAME, DB_VERSION);
      expect(db).toBe(mockDatabase);
    });

    it('should handle database opening errors', async () => {
      const dbPromise = initializeDatabase();
      
      setTimeout(() => {
        mockOpenRequest.error = new Error('Database open failed');
        if (mockOpenRequest.onerror) {
          mockOpenRequest.onerror();
        }
      }, 0);

      await expect(dbPromise).rejects.toThrow('Failed to open database');
    });

    it('should create schema on upgrade needed', async () => {
      const dbPromise = initializeDatabase();
      
      setTimeout(() => {
        // Simulate upgrade needed event
        const upgradeEvent = {
          target: { result: mockDatabase }
        };
        
        if (mockOpenRequest.onupgradeneeded) {
          mockOpenRequest.onupgradeneeded(upgradeEvent);
        }
        
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess();
        }
      }, 0);

      await dbPromise;
      
      expect(mockDatabase.createObjectStore).toHaveBeenCalledWith(
        STORES.SESSIONS,
        { keyPath: 'id' }
      );
      
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith(
        INDEXES.SESSIONS.BY_STATUS,
        'status',
        { unique: false }
      );
    });

    it('should delete existing store during upgrade', async () => {
      mockDatabase.objectStoreNames.contains.mockReturnValue(true);
      
      const dbPromise = initializeDatabase();
      
      setTimeout(() => {
        const upgradeEvent = {
          target: { result: mockDatabase }
        };
        
        if (mockOpenRequest.onupgradeneeded) {
          mockOpenRequest.onupgradeneeded(upgradeEvent);
        }
        
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess();
        }
      }, 0);

      await dbPromise;
      
      expect(mockDatabase.deleteObjectStore).toHaveBeenCalledWith(STORES.SESSIONS);
      expect(mockDatabase.createObjectStore).toHaveBeenCalled();
    });
  });

  describe('getDatabase', () => {
    it('should return existing database instance', async () => {
      // First initialize
      const dbPromise1 = initializeDatabase();
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess();
        }
      }, 0);
      await dbPromise1;

      // Then get existing instance
      const db = await getDatabase();
      expect(db).toBe(mockDatabase);
      
      // Should not call indexedDB.open again
      expect(indexedDB.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', async () => {
      // Initialize first
      const dbPromise = initializeDatabase();
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess();
        }
      }, 0);
      await dbPromise;

      closeDatabase();
      
      expect(mockDatabase.close).toHaveBeenCalled();
    });

    it('should handle closing when no database is open', () => {
      expect(() => closeDatabase()).not.toThrow();
    });
  });

  describe('deleteDatabase', () => {
    it('should delete database successfully', async () => {
      const deletePromise = deleteDatabase();
      
      setTimeout(() => {
        if (mockDeleteRequest.onsuccess) {
          mockDeleteRequest.onsuccess();
        }
      }, 0);

      await deletePromise;
      
      expect(indexedDB.deleteDatabase).toHaveBeenCalledWith(DB_NAME);
    });

    it('should handle delete errors', async () => {
      const deletePromise = deleteDatabase();
      
      setTimeout(() => {
        mockDeleteRequest.error = new Error('Delete failed');
        if (mockDeleteRequest.onerror) {
          mockDeleteRequest.onerror();
        }
      }, 0);

      await expect(deletePromise).rejects.toThrow('Failed to delete database');
    });

    it('should handle blocked delete', async () => {
      const deletePromise = deleteDatabase();
      
      setTimeout(() => {
        if (mockDeleteRequest.onblocked) {
          mockDeleteRequest.onblocked();
        }
      }, 0);

      await expect(deletePromise).rejects.toThrow('Database deletion blocked');
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information when supported', async () => {
      const mockEstimate = {
        usage: 1024 * 1024, // 1MB
        quota: 1024 * 1024 * 1024 // 1GB
      };

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: jest.fn().mockResolvedValue(mockEstimate)
        }
      });

      const info = await getStorageInfo();
      
      expect(info.usage).toBe(1024 * 1024);
      expect(info.quota).toBe(1024 * 1024 * 1024);
      expect(info.usagePercentage).toBe(0.09765625); // 1MB / 1GB * 100
    });

    it('should return zero values when storage API not supported', async () => {
      const originalStorage = navigator.storage;
      delete (navigator as any).storage;

      const info = await getStorageInfo();
      
      expect(info.usage).toBe(0);
      expect(info.quota).toBe(0);
      expect(info.usagePercentage).toBe(0);

      (navigator as any).storage = originalStorage;
    });
  });

  describe('handleDatabaseError', () => {
    it('should handle quota exceeded error', () => {
      const error = { name: 'QuotaExceededError', message: 'Quota exceeded' };
      const result = handleDatabaseError(error, 'saveSession');
      
      expect(result.message).toContain('Storage quota exceeded');
    });

    it('should handle version error', () => {
      const error = { name: 'VersionError', message: 'Version conflict' };
      const result = handleDatabaseError(error, 'openDatabase');
      
      expect(result.message).toContain('Database version conflict');
    });

    it('should handle invalid state error', () => {
      const error = { name: 'InvalidStateError', message: 'Invalid state' };
      const result = handleDatabaseError(error, 'transaction');
      
      expect(result.message).toContain('Database is in an invalid state');
    });

    it('should handle not found error', () => {
      const error = { name: 'NotFoundError', message: 'Not found' };
      const result = handleDatabaseError(error, 'getSession');
      
      expect(result.message).toContain('Requested data not found');
    });

    it('should handle generic errors', () => {
      const error = { name: 'UnknownError', message: 'Something went wrong' };
      const result = handleDatabaseError(error, 'operation');
      
      expect(result.message).toContain('Database operation failed');
      expect(result.message).toContain('Something went wrong');
    });

    it('should handle errors without message', () => {
      const error = { name: 'UnknownError' };
      const result = handleDatabaseError(error, 'operation');
      
      expect(result.message).toContain('Unknown error');
    });
  });

  describe('validateDatabaseIntegrity', () => {
    it('should return true for valid database', async () => {
      mockDatabase.objectStoreNames.contains.mockReturnValue(true);
      
      // Mock getDatabase to return our mock
      const dbPromise = initializeDatabase();
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess();
        }
      }, 0);
      await dbPromise;

      const isValid = await validateDatabaseIntegrity();
      expect(isValid).toBe(true);
    });

    it('should return false for missing object stores', async () => {
      mockDatabase.objectStoreNames.contains.mockReturnValue(false);
      
      const dbPromise = initializeDatabase();
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess();
        }
      }, 0);
      await dbPromise;

      const isValid = await validateDatabaseIntegrity();
      expect(isValid).toBe(false);
    });

    it('should return false on database errors', async () => {
      // Mock getDatabase to throw error
      jest.doMock('../database', () => ({
        ...jest.requireActual('../database'),
        getDatabase: jest.fn().mockRejectedValue(new Error('DB Error'))
      }));

      const isValid = await validateDatabaseIntegrity();
      expect(isValid).toBe(false);
    });
  });
});