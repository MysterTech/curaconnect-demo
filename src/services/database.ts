// Database configuration
export const DB_NAME = "MedicalScribeDB";
export const DB_VERSION = 1;

// Object store names
export const STORES = {
  SESSIONS: "sessions",
} as const;

// Index names for efficient querying
export const INDEXES = {
  SESSIONS: {
    BY_STATUS: "by_status",
    BY_CREATED_DATE: "by_created_date",
    BY_UPDATED_DATE: "by_updated_date",
    BY_PATIENT_ID: "by_patient_id",
    BY_VISIT_TYPE: "by_visit_type",
    BY_PROCESSING_STATUS: "by_processing_status",
  },
} as const;

// Database instance
let dbInstance: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database with proper schema and indexes
 */
export const initializeDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Return existing instance if already initialized
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle database close events
      dbInstance.onclose = () => {
        console.warn("Database connection closed unexpectedly");
        dbInstance = null;
      };

      // Handle version change events (when another tab upgrades the database)
      dbInstance.onversionchange = () => {
        console.warn(
          "Database version changed by another tab, closing connection"
        );
        dbInstance?.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      try {
        createSessionsStore(db);
        console.log("Database schema created successfully");
      } catch (error) {
        console.error("Error creating database schema:", error);
        reject(error);
      }
    };
  });
};

/**
 * Create the sessions object store with all necessary indexes
 */
const createSessionsStore = (db: IDBDatabase): void => {
  // Delete existing store if it exists (for upgrades)
  if (db.objectStoreNames.contains(STORES.SESSIONS)) {
    db.deleteObjectStore(STORES.SESSIONS);
  }

  // Create sessions object store with 'id' as the key path
  const sessionsStore = db.createObjectStore(STORES.SESSIONS, {
    keyPath: "id",
  });

  // Create indexes for efficient querying

  // Index by session status (active, paused, completed)
  sessionsStore.createIndex(INDEXES.SESSIONS.BY_STATUS, "status", {
    unique: false,
  });

  // Index by creation date for chronological sorting
  sessionsStore.createIndex(INDEXES.SESSIONS.BY_CREATED_DATE, "createdAt", {
    unique: false,
  });

  // Index by last updated date
  sessionsStore.createIndex(INDEXES.SESSIONS.BY_UPDATED_DATE, "updatedAt", {
    unique: false,
  });

  // Index by patient identifier for patient-specific queries
  sessionsStore.createIndex(
    INDEXES.SESSIONS.BY_PATIENT_ID,
    "patientContext.identifier",
    {
      unique: false,
    }
  );

  // Index by visit type for filtering
  sessionsStore.createIndex(
    INDEXES.SESSIONS.BY_VISIT_TYPE,
    "patientContext.visitType",
    {
      unique: false,
    }
  );

  // Index by processing status for filtering incomplete sessions
  sessionsStore.createIndex(
    INDEXES.SESSIONS.BY_PROCESSING_STATUS,
    "metadata.processingStatus",
    {
      unique: false,
    }
  );

  console.log("Sessions object store and indexes created");
};

/**
 * Get the database instance, initializing if necessary
 */
export const getDatabase = async (): Promise<IDBDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  return await initializeDatabase();
};

/**
 * Close the database connection
 */
export const closeDatabase = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

/**
 * Delete the entire database (for testing or data reset)
 */
export const deleteDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Close existing connection first
    closeDatabase();

    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

    deleteRequest.onsuccess = () => {
      console.log("Database deleted successfully");
      resolve();
    };

    deleteRequest.onerror = () => {
      reject(
        new Error(`Failed to delete database: ${deleteRequest.error?.message}`)
      );
    };

    deleteRequest.onblocked = () => {
      console.warn(
        "Database deletion blocked - close all tabs using this database"
      );
      reject(new Error("Database deletion blocked by other connections"));
    };
  });
};

/**
 * Check if IndexedDB is supported in the current browser
 */
export const isIndexedDBSupported = (): boolean => {
  return "indexedDB" in window && indexedDB !== null;
};

/**
 * Get database storage usage information
 */
export const getStorageInfo = async (): Promise<{
  usage: number;
  quota: number;
  usagePercentage: number;
}> => {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      usagePercentage,
    };
  }

  return {
    usage: 0,
    quota: 0,
    usagePercentage: 0,
  };
};

/**
 * Handle database errors with proper logging and user-friendly messages
 */
export const handleDatabaseError = (error: any, operation: string): Error => {
  console.error(`Database error during ${operation}:`, error);

  // Map common IndexedDB errors to user-friendly messages
  if (error?.name === "QuotaExceededError") {
    return new Error(
      "Storage quota exceeded. Please delete some old sessions to free up space."
    );
  }

  if (error?.name === "VersionError") {
    return new Error(
      "Database version conflict. Please refresh the page and try again."
    );
  }

  if (error?.name === "InvalidStateError") {
    return new Error(
      "Database is in an invalid state. Please refresh the page."
    );
  }

  if (error?.name === "NotFoundError") {
    return new Error("Requested data not found in database.");
  }

  return new Error(
    `Database operation failed: ${error?.message || "Unknown error"}`
  );
};

/**
 * Create a transaction with proper error handling
 */
export const createTransaction = (
  db: IDBDatabase,
  storeNames: string | string[],
  mode: IDBTransactionMode = "readonly"
): IDBTransaction => {
  const transaction = db.transaction(storeNames, mode);

  transaction.onerror = () => {
    console.error("Transaction error:", transaction.error);
  };

  transaction.onabort = () => {
    console.warn("Transaction aborted:", transaction.error);
  };

  return transaction;
};

/**
 * Perform database migration if needed (for future schema changes)
 */
export const migrateDatabase = (
  _db: IDBDatabase,
  oldVersion: number,
  newVersion: number
): void => {
  console.log(`Migrating database from version ${oldVersion} to ${newVersion}`);

  // Future migrations can be added here
  // Example:
  // if (oldVersion < 2) {
  //   // Add new indexes or modify schema
  // }
};

/**
 * Validate database integrity
 */
export const validateDatabaseIntegrity = async (): Promise<boolean> => {
  try {
    const db = await getDatabase();

    // Check if all required object stores exist
    if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
      console.error("Sessions object store missing");
      return false;
    }

    // Additional integrity checks can be added here
    return true;
  } catch (error) {
    console.error("Database integrity check failed:", error);
    return false;
  }
};
