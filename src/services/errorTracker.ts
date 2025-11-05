import logger from './logger';
import { Request } from 'express';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    userId?: string;
    userAction?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    statusCode?: number;
    systemState?: Record<string, any>;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export interface ErrorStats {
  totalErrors: number;
  unresolvedErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: ErrorReport[];
  topErrors: Array<{ error: string; count: number }>;
}

class ErrorTracker {
  private errors: Map<string, ErrorReport> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private maxStoredErrors = 1000;

  constructor() {
    // Clean up old errors periodically
    setInterval(() => {
      this.cleanupOldErrors();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error, statusCode?: number): ErrorReport['severity'] {
    // Critical errors
    if (error.name === 'MongoError' || error.message.includes('database')) {
      return 'critical';
    }
    
    if (statusCode && statusCode >= 500) {
      return 'high';
    }
    
    if (statusCode && statusCode >= 400) {
      return 'medium';
    }
    
    // Authentication/authorization errors
    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      return 'medium';
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
      return 'low';
    }
    
    return 'medium';
  }

  trackError(error: Error, req?: Request, additionalContext?: Record<string, any>): string {
    const errorId = this.generateErrorId();
    const timestamp = new Date();
    
    // Create context from request if available
    const context = req ? logger.createRequestContext(req, additionalContext) : additionalContext || {};
    
    // Determine severity
    const severity = this.determineSeverity(error, context?.statusCode);
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: context || {},
      severity,
      resolved: false
    };

    // Store error report
    this.errors.set(errorId, errorReport);
    
    // Update error counts
    const errorKey = `${error.name}: ${error.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // Log the error
    logger.error(
      `Error tracked: ${error.message}`,
      error,
      context,
      { errorId, severity }
    );
    
    // Clean up if we have too many stored errors
    if (this.errors.size > this.maxStoredErrors) {
      this.cleanupOldErrors();
    }
    
    return errorId;
  }

  resolveError(errorId: string, resolvedBy: string, notes?: string): boolean {
    const errorReport = this.errors.get(errorId);
    
    if (!errorReport) {
      logger.warn(`Attempted to resolve non-existent error: ${errorId}`);
      return false;
    }
    
    errorReport.resolved = true;
    errorReport.resolvedAt = new Date();
    errorReport.resolvedBy = resolvedBy;
    errorReport.notes = notes;
    
    this.errors.set(errorId, errorReport);
    
    logger.info(
      `Error resolved: ${errorId}`,
      { userId: resolvedBy },
      { errorId, notes }
    );
    
    return true;
  }

  getError(errorId: string): ErrorReport | undefined {
    return this.errors.get(errorId);
  }

  getErrorStats(): ErrorStats {
    const allErrors = Array.from(this.errors.values());
    const unresolvedErrors = allErrors.filter(err => !err.resolved);
    
    // Count errors by type
    const errorsByType: Record<string, number> = {};
    allErrors.forEach(err => {
      errorsByType[err.error.name] = (errorsByType[err.error.name] || 0) + 1;
    });
    
    // Count errors by severity
    const errorsBySeverity: Record<string, number> = {};
    allErrors.forEach(err => {
      errorsBySeverity[err.severity] = (errorsBySeverity[err.severity] || 0) + 1;
    });
    
    // Get recent errors (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentErrors = allErrors
      .filter(err => err.timestamp > oneDayAgo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    // Get top errors by count
    const topErrors = Array.from(this.errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
    
    return {
      totalErrors: allErrors.length,
      unresolvedErrors: unresolvedErrors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors,
      topErrors
    };
  }

  getUnresolvedErrors(limit: number = 50): ErrorReport[] {
    return Array.from(this.errors.values())
      .filter(err => !err.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getCriticalErrors(): ErrorReport[] {
    return Array.from(this.errors.values())
      .filter(err => err.severity === 'critical' && !err.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private cleanupOldErrors(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const errorsToDelete: string[] = [];
    
    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < thirtyDaysAgo && error.resolved) {
        errorsToDelete.push(id);
      }
    }
    
    errorsToDelete.forEach(id => {
      this.errors.delete(id);
    });
    
    if (errorsToDelete.length > 0) {
      logger.info(`Cleaned up ${errorsToDelete.length} old resolved errors`);
    }
  }

  // Method to export error data for analysis
  exportErrors(startDate?: Date, endDate?: Date): ErrorReport[] {
    const allErrors = Array.from(this.errors.values());
    
    if (!startDate && !endDate) {
      return allErrors;
    }
    
    return allErrors.filter(err => {
      if (startDate && err.timestamp < startDate) return false;
      if (endDate && err.timestamp > endDate) return false;
      return true;
    });
  }

  // Method to get error trends
  getErrorTrends(days: number = 7): Array<{ date: string; count: number; severity: Record<string, number> }> {
    const trends: Array<{ date: string; count: number; severity: Record<string, number> }> = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayErrors = Array.from(this.errors.values()).filter(
        err => err.timestamp >= date && err.timestamp < nextDate
      );
      
      const severityCount: Record<string, number> = {};
      dayErrors.forEach(err => {
        severityCount[err.severity] = (severityCount[err.severity] || 0) + 1;
      });
      
      trends.push({
        date: date.toISOString().split('T')[0],
        count: dayErrors.length,
        severity: severityCount
      });
    }
    
    return trends;
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

export default errorTracker;