/**
 * Security utilities for handling sensitive medical data
 */

// Secure memory management for sensitive data
export class SecureString {
  private data: Uint8Array;
  private isCleared = false;

  constructor(value: string) {
    const encoder = new TextEncoder();
    this.data = encoder.encode(value);
  }

  getValue(): string {
    if (this.isCleared) {
      throw new Error('SecureString has been cleared');
    }
    const decoder = new TextDecoder();
    return decoder.decode(this.data);
  }

  clear(): void {
    if (!this.isCleared) {
      // Overwrite memory with random data
      crypto.getRandomValues(this.data);
      this.data.fill(0);
      this.isCleared = true;
    }
  }

  isDestroyed(): boolean {
    return this.isCleared;
  }
}

// Secure session storage with encryption
export class SecureSessionStorage {
  private static readonly ENCRYPTION_KEY_NAME = 'session_key';
  private static encryptionKey: CryptoKey | null = null;

  static async initialize(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      const keyData = sessionStorage.getItem(this.ENCRYPTION_KEY_NAME);
      if (keyData) {
        const keyBuffer = new Uint8Array(JSON.parse(keyData));
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        const keyBuffer = await crypto.subtle.exportKey('raw', this.encryptionKey);
        sessionStorage.setItem(
          this.ENCRYPTION_KEY_NAME,
          JSON.stringify(Array.from(new Uint8Array(keyBuffer)))
        );
      }
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw new Error('Secure storage initialization failed');
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(value);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        data
      );

      const encryptedItem = {
        data: Array.from(new Uint8Array(encryptedData)),
        iv: Array.from(iv)
      };

      sessionStorage.setItem(key, JSON.stringify(encryptedItem));
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw new Error('Data encryption failed');
    }
  }

  static async getItem(key: string): Promise<string | null> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    try {
      const encryptedItem = sessionStorage.getItem(key);
      if (!encryptedItem) return null;

      const { data, iv } = JSON.parse(encryptedItem);
      const encryptedData = new Uint8Array(data);
      const ivArray = new Uint8Array(iv);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivArray },
        this.encryptionKey!,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  static clear(): void {
    sessionStorage.clear();
    this.encryptionKey = null;
  }
}

// API security utilities
export const ApiSecurity = {
  // Ensure HTTPS for API calls
  validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || 
             (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1');
    } catch {
      return false;
    }
  },

  // Sanitize API keys
  sanitizeApiKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9\-_]/g, '');
  },

  // Create secure headers
  createSecureHeaders(apiKey?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${this.sanitizeApiKey(apiKey)}`;
    }

    return headers;
  }
};

// Data sanitization utilities
export const DataSanitizer = {
  // Remove PII from logs
  sanitizeForLogging(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = [
      'ssn', 'social', 'dob', 'dateOfBirth', 'phone', 'email', 
      'address', 'name', 'firstName', 'lastName', 'patientId',
      'mrn', 'medicalRecordNumber', 'apiKey', 'token', 'password'
    ];

    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    }

    return sanitized;
  },

  // Validate input data
  validateInput(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Remove potentially dangerous characters
    return input.replace(/[<>\"'&]/g, '');
  }
};

// Memory cleanup utilities
export const MemoryManager = {
  // Clear sensitive data from memory
  clearSensitiveData(obj: any): void {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            obj[key] = '';
          } else if (typeof obj[key] === 'object') {
            this.clearSensitiveData(obj[key]);
          }
        }
      }
    }
  },

  // Force garbage collection (if available)
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }
};