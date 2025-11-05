import fs from 'fs';
import path from 'path';
import { Request } from 'express';

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: {
    userId?: string;
    userAction?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    systemState?: Record<string, any>;
  };
  stack?: string;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  logDirectory: string;
  maxLogFileSize: number; // in MB
  maxLogFiles: number;
  enableRotation: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logDirectory: string;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      logLevel: 'info',
      enableFileLogging: true,
      enableConsoleLogging: true,
      logDirectory: path.join(process.cwd(), 'logs'),
      maxLogFileSize: 10, // 10MB
      maxLogFiles: 5,
      enableRotation: true,
      ...config
    };

    this.logDirectory = this.config.logDirectory;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.warn(`Failed to create log directory ${this.logDirectory}:`, error);
      
      // Try fallback directories
      const fallbackDirs = [
        '/tmp/logs',
        path.join(process.cwd(), 'tmp', 'logs'),
        path.join(__dirname, '..', '..', 'tmp', 'logs')
      ];
      
      let fallbackSuccess = false;
      for (const fallbackDir of fallbackDirs) {
        try {
          if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
          }
          this.logDirectory = fallbackDir;
          this.config.logDirectory = fallbackDir;
          console.info(`Using fallback log directory: ${fallbackDir}`);
          fallbackSuccess = true;
          break;
        } catch (fallbackError) {
          console.warn(`Fallback directory ${fallbackDir} also failed:`, fallbackError);
        }
      }
      
      if (!fallbackSuccess) {
        console.warn('All log directories failed, disabling file logging');
        this.config.enableFileLogging = false;
      }
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= configLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    
    let logLine = `[${timestamp}] ${level} ${entry.message}`;
    
    if (entry.context) {
      const contextStr = Object.entries(entry.context)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      
      if (contextStr) {
        logLine += ` | ${contextStr}`;
      }
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logLine += ` | metadata=${JSON.stringify(entry.metadata)}`;
    }

    if (entry.stack) {
      logLine += `\nStack: ${entry.stack}`;
    }

    return logLine;
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.config.enableFileLogging) return;

    const logFileName = `${entry.level}-${new Date().toISOString().split('T')[0]}.log`;
    const logFilePath = path.join(this.logDirectory, logFileName);
    
    const logLine = this.formatLogEntry(entry) + '\n';

    try {
      // Check file size and rotate if necessary
      if (this.config.enableRotation && fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        
        if (fileSizeInMB > this.config.maxLogFileSize) {
          this.rotateLogFile(logFilePath);
        }
      }

      fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
      // Disable file logging if we can't write
      this.config.enableFileLogging = false;
      console.warn('File logging has been disabled due to write errors');
    }
  }

  private rotateLogFile(logFilePath: string): void {
    const dir = path.dirname(logFilePath);
    const basename = path.basename(logFilePath, '.log');
    
    // Remove oldest log file if we exceed max files
    const rotatedFile = path.join(dir, `${basename}.${this.config.maxLogFiles}.log`);
    if (fs.existsSync(rotatedFile)) {
      fs.unlinkSync(rotatedFile);
    }

    // Shift existing rotated files
    for (let i = this.config.maxLogFiles - 1; i >= 1; i--) {
      const oldFile = path.join(dir, `${basename}.${i}.log`);
      const newFile = path.join(dir, `${basename}.${i + 1}.log`);
      
      if (fs.existsSync(oldFile)) {
        fs.renameSync(oldFile, newFile);
      }
    }

    // Rotate current file
    const rotatedCurrentFile = path.join(dir, `${basename}.1.log`);
    fs.renameSync(logFilePath, rotatedCurrentFile);
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleLogging) return;

    const formattedEntry = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case 'error':
        console.error(formattedEntry);
        break;
      case 'warn':
        console.warn(formattedEntry);
        break;
      case 'info':
        console.info(formattedEntry);
        break;
      case 'debug':
        console.debug(formattedEntry);
        break;
    }
  }

  private log(level: LogEntry['level'], message: string, error?: Error, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      error,
      context,
      metadata,
      stack: error?.stack
    };

    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  error(message: string, error?: Error, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    this.log('error', message, error, context, metadata);
  }

  warn(message: string, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    this.log('warn', message, undefined, context, metadata);
  }

  info(message: string, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    this.log('info', message, undefined, context, metadata);
  }

  debug(message: string, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    this.log('debug', message, undefined, context, metadata);
  }

  // Helper method to create context from Express request
  createRequestContext(req: Request, additionalContext?: Record<string, any>): LogEntry['context'] {
    return {
      requestId: (req as any).requestId || 'unknown',
      userId: (req as any).user?.id || 'anonymous',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      ...additionalContext
    };
  }

  // Method to log user actions
  logUserAction(action: string, req: Request, metadata?: Record<string, any>): void {
    const context = this.createRequestContext(req, { userAction: action });
    this.info(`User action: ${action}`, context, metadata);
  }

  // Method to log system state
  logSystemState(component: string, state: Record<string, any>, context?: LogEntry['context']): void {
    this.info(`System state: ${component}`, context, { systemState: state });
  }

  // Method to get log statistics
  getLogStats(): { totalErrors: number; totalWarnings: number; totalLogs: number } {
    const stats = { totalErrors: 0, totalWarnings: 0, totalLogs: 0 };
    
    try {
      const logFiles = fs.readdirSync(this.logDirectory);
      
      for (const file of logFiles) {
        if (file.endsWith('.log')) {
          const content = fs.readFileSync(path.join(this.logDirectory, file), 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          stats.totalLogs += lines.length;
          
          for (const line of lines) {
            if (line.includes('ERROR')) stats.totalErrors++;
            if (line.includes('WARN')) stats.totalWarnings++;
          }
        }
      }
    } catch (error) {
      this.error('Failed to get log statistics', error as Error);
    }
    
    return stats;
  }

  // Method to clean old logs
  cleanOldLogs(daysToKeep: number = 30): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const logFiles = fs.readdirSync(this.logDirectory);
      
      for (const file of logFiles) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.logDirectory, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            this.info(`Cleaned old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      this.error('Failed to clean old logs', error as Error);
    }
  }
}

// Create singleton instance with production-friendly defaults
const isProduction = process.env.NODE_ENV === 'production';
const logger = new Logger({
  logLevel: process.env.LOG_LEVEL as any || 'info',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true' || (!isProduction && process.env.ENABLE_FILE_LOGGING !== 'false'),
  enableConsoleLogging: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
  logDirectory: process.env.LOG_DIRECTORY || (isProduction ? '/tmp/logs' : path.join(process.cwd(), 'logs')),
  maxLogFileSize: parseInt(process.env.MAX_LOG_FILE_SIZE || '10'),
  maxLogFiles: parseInt(process.env.MAX_LOG_FILES || '5'),
  enableRotation: process.env.ENABLE_LOG_ROTATION !== 'false'
});

export default logger;