/**
 * Storage optimization utilities for IndexedDB and caching
 */

import { Session } from '../models/types';

// Cache management for frequently accessed data
export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Batch operations for IndexedDB
export class BatchProcessor {
  private operations: Array<() => Promise<any>> = [];
  private batchSize: number;
  private processingDelay: number;
  private timeout: NodeJS.Timeout | null = null;

  constructor(batchSize: number = 10, processingDelay: number = 100) {
    this.batchSize = batchSize;
    this.processingDelay = processingDelay;
  }

  add(operation: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.operations.push(async () => {
        try {
          const result = await operation();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });

      // Process immediately if batch is full
      if (this.operations.length >= this.batchSize) {
        this.processBatch();
      } else {
        // Schedule processing if not already scheduled
        if (!this.timeout) {
          this.timeout = setTimeout(() => {
            this.processBatch();
          }, this.processingDelay);
        }
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.operations.length === 0) return;

    const batch = this.operations.splice(0, this.batchSize);
    
    try {
      // Execute operations in parallel
      await Promise.all(batch.map(op => op()));
    } catch (error) {
      console.error('Batch processing error:', error);
    }

    // Process remaining operations if any
    if (this.operations.length > 0) {
      setTimeout(() => this.processBatch(), 10);
    }
  }

  flush(): Promise<void> {
    return this.processBatch();
  }
}

// Optimized IndexedDB wrapper
export class OptimizedIndexedDB {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;
  private cache = new MemoryCache<any>(200, 10 * 60 * 1000); // 10 minutes cache
  private batchProcessor = new BatchProcessor(15, 50);
  private connectionPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string, version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  async connect(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupDatabase(db);
      };
    });

    return this.connectionPromise;
  }

  private setupDatabase(db: IDBDatabase): void {
    // Create sessions store if it doesn't exist
    if (!db.objectStoreNames.contains('sessions')) {
      const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionsStore.createIndex('status', 'status', { unique: false });
      sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
      sessionsStore.createIndex('patientId', 'patientContext.identifier', { unique: false });
    }

    // Create cache store for frequently accessed data
    if (!db.objectStoreNames.contains('cache')) {
      db.createObjectStore('cache', { keyPath: 'key' });
    }
  }

  async get<T>(storeName: string, key: string, useCache: boolean = true): Promise<T | null> {
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(`${storeName}:${key}`);
      if (cached) {
        return cached;
      }
    }

    const db = await this.connect();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result || null;
        
        // Cache the result
        if (result && useCache) {
          this.cache.set(`${storeName}:${key}`, result);
        }
        
        resolve(result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string, useCache: boolean = false): Promise<T[]> {
    // For getAll, we typically don't cache due to size
    const db = await this.connect();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T, useCache: boolean = true): Promise<void> {
    const key = (data as any).id;
    
    // Update cache immediately for optimistic updates
    if (useCache && key) {
      this.cache.set(`${storeName}:${key}`, data);
    }

    return this.batchProcessor.add(async () => {
      const db = await this.connect();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      return new Promise<void>((resolve, reject) => {
        const request = store.put(data);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          // Remove from cache if database operation failed
          if (useCache && key) {
            this.cache.delete(`${storeName}:${key}`);
          }
          reject(request.error);
        };
      });
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    // Remove from cache immediately
    this.cache.delete(`${storeName}:${key}`);

    return this.batchProcessor.add(async () => {
      const db = await this.connect();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      return new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getByIndex<T>(
    storeName: string, 
    indexName: string, 
    value: any,
    useCache: boolean = true
  ): Promise<T[]> {
    const cacheKey = `${storeName}:index:${indexName}:${value}`;
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const db = await this.connect();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      
      request.onsuccess = () => {
        const result = request.result || [];
        
        if (useCache) {
          this.cache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes for index queries
        }
        
        resolve(result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName: string): Promise<number> {
    const db = await this.connect();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk operations for better performance
  async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.connect();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      const onComplete = () => {
        completed++;
        if (completed === items.length && !hasError) {
          resolve();
        }
      };

      const onError = (error: any) => {
        if (!hasError) {
          hasError = true;
          reject(error);
        }
      };

      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = onComplete;
        request.onerror = () => onError(request.error);
      });

      if (items.length === 0) {
        resolve();
      }
    });
  }

  // Cache management
  invalidateCache(pattern?: string): void {
    if (pattern) {
      // Invalidate specific cache entries matching pattern
      for (const key of Array.from(this.cache['cache'].keys())) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Performance monitoring
  getPerformanceStats(): {
    cacheSize: number;
    cacheHitRate: number;
    pendingOperations: number;
  } {
    return {
      cacheSize: this.cache.size(),
      cacheHitRate: 0, // Would need to track hits/misses
      pendingOperations: this.batchProcessor['operations'].length
    };
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    this.cache.cleanup();
    await this.batchProcessor.flush();
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.cache.clear();
    this.connectionPromise = null;
  }
}

// Session-specific optimizations
export class SessionStorageOptimizer {
  private optimizedDB: OptimizedIndexedDB;
  private recentSessions = new MemoryCache<Session>(50, 15 * 60 * 1000); // 15 minutes

  constructor(db: OptimizedIndexedDB) {
    this.optimizedDB = db;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    // Check recent sessions cache first
    const cached = this.recentSessions.get(sessionId);
    if (cached) {
      return cached;
    }

    const session = await this.optimizedDB.get<Session>('sessions', sessionId);
    
    if (session) {
      this.recentSessions.set(sessionId, session);
    }

    return session;
  }

  async saveSession(session: Session): Promise<void> {
    // Update recent cache
    this.recentSessions.set(session.id, session);
    
    // Save to database
    await this.optimizedDB.put('sessions', session);
  }

  async getSessionsByStatus(status: string): Promise<Session[]> {
    return this.optimizedDB.getByIndex<Session>('sessions', 'status', status);
  }

  async getRecentSessions(limit: number = 10): Promise<Session[]> {
    // Try to get from cache first
    const allSessions = await this.optimizedDB.getAll<Session>('sessions');
    
    return allSessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Preload frequently accessed sessions
  async preloadFrequentSessions(): Promise<void> {
    const recentSessions = await this.getRecentSessions(20);
    
    recentSessions.forEach(session => {
      this.recentSessions.set(session.id, session);
    });
  }

  // Clean up old sessions to free space
  async cleanupOldSessions(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const allSessions = await this.optimizedDB.getAll<Session>('sessions');
    const oldSessions = allSessions.filter(
      session => new Date(session.createdAt) < cutoffDate
    );

    // Delete old sessions
    await Promise.all(
      oldSessions.map(session => this.optimizedDB.delete('sessions', session.id))
    );

    return oldSessions.length;
  }
}

// Storage quota management
export class StorageQuotaManager {
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate();
    }
    return null;
  }

  async getUsagePercentage(): Promise<number> {
    const estimate = await this.getStorageEstimate();
    
    if (estimate && estimate.quota && estimate.usage) {
      return (estimate.usage / estimate.quota) * 100;
    }
    
    return 0;
  }

  async isStorageAvailable(requiredBytes: number): Promise<boolean> {
    const estimate = await this.getStorageEstimate();
    
    if (estimate && estimate.quota && estimate.usage) {
      const available = estimate.quota - estimate.usage;
      return available >= requiredBytes;
    }
    
    return true; // Assume available if we can't check
  }

  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return navigator.storage.persist();
    }
    return false;
  }

  async isPersistent(): Promise<boolean> {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      return navigator.storage.persisted();
    }
    return false;
  }
}

// Export optimized storage instance
export const optimizedStorage = new OptimizedIndexedDB('medicalScribe', 1);
export const sessionOptimizer = new SessionStorageOptimizer(optimizedStorage);
export const quotaManager = new StorageQuotaManager();