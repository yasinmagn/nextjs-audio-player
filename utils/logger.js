/**
 * Advanced logging utilities for the Audio Player
 * Provides session management, log aggregation, and performance monitoring
 */

import { logger, LOG_CATEGORIES } from './config';

/**
 * Session-based logging with aggregation and export capabilities
 */
class AudioPlayerLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionLogs = [];
    this.performanceMetrics = {
      loadTimes: [],
      seekOperations: [],
      networkRequests: [],
      errors: []
    };
    this.sessionStartTime = Date.now();
    
    const sessionUserAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR';
    logger.info(LOG_CATEGORIES.INIT, 'Logger session started', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: sessionUserAgent
    });
  }

  generateSessionId() {
    return `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log with session tracking
   */
  log(level, category, message, data = {}) {
    const logEntry = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      level,
      category,
      message,
      data,
      sessionTime: Date.now() - this.sessionStartTime
    };

    this.sessionLogs.push(logEntry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.sessionLogs.length > 1000) {
      this.sessionLogs = this.sessionLogs.slice(-500);
    }

    // Use the appropriate logger method
    logger[level](category, message, data);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(type, operation, duration, metadata = {}) {
    const perfEntry = {
      timestamp: Date.now(),
      operation,
      duration,
      metadata
    };

    if (this.performanceMetrics[type]) {
      this.performanceMetrics[type].push(perfEntry);
    }

    logger.info(LOG_CATEGORIES.PERF, `Performance: ${operation}`, {
      duration: `${duration}ms`,
      type,
      ...metadata
    });
  }

  /**
   * Track network requests with timing
   */
  trackNetworkRequest(method, url, status, duration, size = null) {
    this.trackPerformance('networkRequests', `${method} ${url}`, duration, {
      status,
      size: size ? `${Math.round(size / 1024)}KB` : 'unknown'
    });
  }

  /**
   * Track audio loading performance
   */
  trackAudioLoad(duration, metadata = {}) {
    this.trackPerformance('loadTimes', 'Audio Load', duration, metadata);
  }

  /**
   * Track seek operations
   */
  trackSeek(fromTime, toTime, duration) {
    this.trackPerformance('seekOperations', 'Audio Seek', duration, {
      from: fromTime,
      to: toTime,
      distance: Math.abs(toTime - fromTime)
    });
  }

  /**
   * Track errors with context
   */
  trackError(error, context = {}) {
    const errorEntry = {
      timestamp: Date.now(),
      error: {
        name: error.name || 'Unknown',
        message: error.message || 'No message',
        stack: error.stack || 'No stack trace'
      },
      context,
      sessionTime: Date.now() - this.sessionStartTime
    };

    this.performanceMetrics.errors.push(errorEntry);
    
    logger.error(LOG_CATEGORIES.ERROR, 'Error tracked', errorEntry);
  }

  /**
   * Get session summary
   */
  getSessionSummary() {
    const summary = {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      totalLogs: this.sessionLogs.length,
      errorCount: this.performanceMetrics.errors.length,
      performance: {
        averageLoadTime: this.calculateAverage(this.performanceMetrics.loadTimes),
        averageSeekTime: this.calculateAverage(this.performanceMetrics.seekOperations),
        averageNetworkTime: this.calculateAverage(this.performanceMetrics.networkRequests),
        totalNetworkRequests: this.performanceMetrics.networkRequests.length
      },
      logsByCategory: this.getLogsByCategory(),
      recentErrors: this.performanceMetrics.errors.slice(-5)
    };

    return summary;
  }

  calculateAverage(metrics) {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + metric.duration, 0);
    return Math.round((sum / metrics.length) * 100) / 100;
  }

  getLogsByCategory() {
    const categories = {};
    this.sessionLogs.forEach(log => {
      categories[log.category] = (categories[log.category] || 0) + 1;
    });
    return categories;
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    const exportData = {
      sessionInfo: {
        sessionId: this.sessionId,
        startTime: new Date(this.sessionStartTime).toISOString(),
        duration: Date.now() - this.sessionStartTime,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
        url: typeof window !== 'undefined' ? window.location.href : 'SSR'
      },
      summary: this.getSessionSummary(),
      logs: this.sessionLogs,
      performanceMetrics: this.performanceMetrics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-player-logs-${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info(LOG_CATEGORIES.INIT, 'Logs exported', {
      filename: a.download,
      logCount: this.sessionLogs.length
    });
  }

  /**
   * Print session summary to console
   */
  printSessionSummary() {
    const summary = this.getSessionSummary();
    
    console.group('🎵 Audio Player Session Summary');
    console.log('Session ID:', summary.sessionId);
    console.log('Duration:', Math.round(summary.sessionDuration / 1000) + 's');
    console.log('Total Logs:', summary.totalLogs);
    console.log('Errors:', summary.errorCount);
    
    console.group('📊 Performance Metrics');
    console.log('Average Load Time:', summary.performance.averageLoadTime + 'ms');
    console.log('Average Seek Time:', summary.performance.averageSeekTime + 'ms');
    console.log('Average Network Time:', summary.performance.averageNetworkTime + 'ms');
    console.log('Network Requests:', summary.performance.totalNetworkRequests);
    console.groupEnd();
    
    console.group('📝 Logs by Category');
    Object.entries(summary.logsByCategory).forEach(([category, count]) => {
      console.log(`${category}:`, count);
    });
    console.groupEnd();
    
    if (summary.recentErrors.length > 0) {
      console.group('❌ Recent Errors');
      summary.recentErrors.forEach((error, index) => {
        console.log(`${index + 1}.`, error.error.message, error.context);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Create singleton instance
const audioPlayerLogger = new AudioPlayerLogger();

// Export convenience methods
export const sessionLogger = {
  info: (category, message, data) => audioPlayerLogger.log('info', category, message, data),
  debug: (category, message, data) => audioPlayerLogger.log('debug', category, message, data),
  warn: (category, message, data) => audioPlayerLogger.log('warn', category, message, data),
  error: (category, message, data) => audioPlayerLogger.log('error', category, message, data),
  
  trackPerformance: (type, operation, duration, metadata) => 
    audioPlayerLogger.trackPerformance(type, operation, duration, metadata),
  trackNetworkRequest: (method, url, status, duration, size) => 
    audioPlayerLogger.trackNetworkRequest(method, url, status, duration, size),
  trackAudioLoad: (duration, metadata) => 
    audioPlayerLogger.trackAudioLoad(duration, metadata),
  trackSeek: (fromTime, toTime, duration) => 
    audioPlayerLogger.trackSeek(fromTime, toTime, duration),
  trackError: (error, context) => 
    audioPlayerLogger.trackError(error, context),
    
  getSessionSummary: () => audioPlayerLogger.getSessionSummary(),
  exportLogs: () => audioPlayerLogger.exportLogs(),
  printSummary: () => audioPlayerLogger.printSessionSummary(),
  
  // Window global for debugging
  installGlobal: () => {
    if (typeof window !== 'undefined') {
      window.audioPlayerLogger = audioPlayerLogger;
      window.exportAudioLogs = () => audioPlayerLogger.exportLogs();
      window.printAudioSummary = () => audioPlayerLogger.printSessionSummary();
      
      logger.info(LOG_CATEGORIES.INIT, 'Global logger methods installed', {
        methods: ['audioPlayerLogger', 'exportAudioLogs', 'printAudioSummary']
      });
    }
  }
};

export default audioPlayerLogger;
