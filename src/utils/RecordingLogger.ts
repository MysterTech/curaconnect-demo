/**
 * Recording logger for tracking recording events and errors
 */

export interface RecordingLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'permission' | 'initialization' | 'recording' | 'device' | 'audio' | 'general';
  message: string;
  details?: any;
  sessionId?: string;
  userId?: string;
}

export interface LogFilter {
  level?: RecordingLog['level'][];
  category?: RecordingLog['category'][];
  startDate?: Date;
  endDate?: Date;
  sessionId?: string;
  searchText?: string;
}

export class RecordingLogger {
  private logs: RecordingLog[] = [];
  private maxLogs: number;
  private enableConsoleOutput: boolean;
  private logCallbacks: ((log: RecordingLog) => void)[] = [];

  constructor(maxLogs: number = 1000, enableConsoleOutput: boolean = true) {
    this.maxLogs = maxLogs;
    this.enableConsoleOutput = enableConsoleOutput;
  }

  /**
   * Log an info message
   */
  info(category: RecordingLog['category'], message: string, details?: any, sessionId?: string): void {
    this.log('info', category, message, details, sessionId);
  }

  /**
   * Log a warning message
   */
  warn(category: RecordingLog['category'], message: string, details?: any, sessionId?: string): void {
    this.log('warn', category, message, details, sessionId);
  }

  /**
   * Log an error message
   */
  error(category: RecordingLog['category'], message: string, details?: any, sessionId?: string): void {
    this.log('error', category, message, details, sessionId);
  }

  /**
   * Log a debug message
   */
  debug(category: RecordingLog['category'], message: string, details?: any, sessionId?: string): void {
    this.log('debug', category, message, details, sessionId);
  }

  /**
   * Log a message
   */
  log(
    level: RecordingLog['level'],
    category: RecordingLog['category'],
    message: string,
    details?: any,
    sessionId?: string
  ): void {
    const log: RecordingLog = {
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      sessionId
    };

    // Add to logs array
    this.logs.push(log);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    if (this.enableConsoleOutput) {
      this.outputToConsole(log);
    }

    // Notify callbacks
    this.notifyCallbacks(log);
  }

  /**
   * Output log to console
   */
  private outputToConsole(log: RecordingLog): void {
    const prefix = `[${log.level.toUpperCase()}] [${log.category}]`;
    const message = `${prefix} ${log.message}`;

    switch (log.level) {
      case 'error':
        console.error(message, log.details || '');
        break;
      case 'warn':
        console.warn(message, log.details || '');
        break;
      case 'debug':
        console.debug(message, log.details || '');
        break;
      case 'info':
      default:
        console.log(message, log.details || '');
    }
  }

  /**
   * Notify log callbacks
   */
  private notifyCallbacks(log: RecordingLog): void {
    this.logCallbacks.forEach(callback => {
      try {
        callback(log);
      } catch (error) {
        console.error('Error in log callback:', error);
      }
    });
  }

  /**
   * Register callback for new logs
   */
  onLog(callback: (log: RecordingLog) => void): void {
    this.logCallbacks.push(callback);
  }

  /**
   * Remove log callback
   */
  removeLogCallback(callback: (log: RecordingLog) => void): void {
    const index = this.logCallbacks.indexOf(callback);
    if (index > -1) {
      this.logCallbacks.splice(index, 1);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): RecordingLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Get all logs
   */
  getAllLogs(): RecordingLog[] {
    return [...this.logs];
  }

  /**
   * Get filtered logs
   */
  getFilteredLogs(filter: LogFilter): RecordingLog[] {
    return this.logs.filter(log => {
      // Filter by level
      if (filter.level && !filter.level.includes(log.level)) {
        return false;
      }

      // Filter by category
      if (filter.category && !filter.category.includes(log.category)) {
        return false;
      }

      // Filter by date range
      if (filter.startDate && log.timestamp < filter.startDate) {
        return false;
      }
      if (filter.endDate && log.timestamp > filter.endDate) {
        return false;
      }

      // Filter by session ID
      if (filter.sessionId && log.sessionId !== filter.sessionId) {
        return false;
      }

      // Filter by search text
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const messageMatch = log.message.toLowerCase().includes(searchLower);
        const detailsMatch = log.details && 
          JSON.stringify(log.details).toLowerCase().includes(searchLower);
        
        if (!messageMatch && !detailsMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get logs by session
   */
  getLogsBySession(sessionId: string): RecordingLog[] {
    return this.logs.filter(log => log.sessionId === sessionId);
  }

  /**
   * Get error logs
   */
  getErrorLogs(): RecordingLog[] {
    return this.logs.filter(log => log.level === 'error');
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: RecordingLog['category']): RecordingLog[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(filter?: LogFilter): string {
    const logsToExport = filter ? this.getFilteredLogs(filter) : this.logs;
    return JSON.stringify(logsToExport, null, 2);
  }

  /**
   * Export logs as CSV string
   */
  exportLogsAsCSV(filter?: LogFilter): string {
    const logsToExport = filter ? this.getFilteredLogs(filter) : this.logs;
    
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Session ID', 'Details'];
    const rows = logsToExport.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.category,
      log.message,
      log.sessionId || '',
      log.details ? JSON.stringify(log.details) : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Clear logs older than specified date
   */
  clearLogsOlderThan(date: Date): void {
    this.logs = this.logs.filter(log => log.timestamp >= date);
  }

  /**
   * Get log statistics
   */
  getStatistics(): {
    total: number;
    byLevel: Record<RecordingLog['level'], number>;
    byCategory: Record<RecordingLog['category'], number>;
    errorRate: number;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0
      },
      byCategory: {
        permission: 0,
        initialization: 0,
        recording: 0,
        device: 0,
        audio: 0,
        general: 0
      },
      errorRate: 0
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category]++;
    });

    stats.errorRate = stats.total > 0 ? stats.byLevel.error / stats.total : 0;

    return stats;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): RecordingLog[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-count);
  }

  /**
   * Check if there are recent errors
   */
  hasRecentErrors(withinMinutes: number = 5): boolean {
    const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);
    return this.logs.some(log => 
      log.level === 'error' && log.timestamp >= cutoffTime
    );
  }

  /**
   * Get log summary for diagnostics
   */
  getLogSummary(): string {
    const stats = this.getStatistics();
    const recentErrors = this.getRecentErrors(5);

    let summary = `Recording Log Summary\n`;
    summary += `=====================\n\n`;
    summary += `Total Logs: ${stats.total}\n`;
    summary += `Errors: ${stats.byLevel.error}\n`;
    summary += `Warnings: ${stats.byLevel.warn}\n`;
    summary += `Info: ${stats.byLevel.info}\n`;
    summary += `Debug: ${stats.byLevel.debug}\n\n`;
    
    summary += `By Category:\n`;
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      summary += `  ${category}: ${count}\n`;
    });

    if (recentErrors.length > 0) {
      summary += `\nRecent Errors:\n`;
      recentErrors.forEach((log, index) => {
        summary += `  ${index + 1}. [${log.timestamp.toISOString()}] ${log.message}\n`;
        if (log.details) {
          summary += `     Details: ${JSON.stringify(log.details)}\n`;
        }
      });
    }

    return summary;
  }

  /**
   * Dispose of the logger
   */
  dispose(): void {
    this.logs = [];
    this.logCallbacks = [];
  }
}

// Export singleton instance
export const recordingLogger = new RecordingLogger();
