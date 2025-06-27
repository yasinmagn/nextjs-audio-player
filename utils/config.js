/**
 * Environment configuration utility
 */

export const config = {
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000',
  
  // Authentication
  auth: {
    defaultEmail: process.env.NEXT_PUBLIC_DEFAULT_EMAIL || '',
    defaultPassword: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || '',
    tokenKey: 'authToken'
  },
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature flags
  features: {
    showDefaultCredentials: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEFAULT_EMAIL,
    enableDebugLogging: process.env.NODE_ENV === 'development'
  }
};

/**
 * Get default login credentials if available
 */
export const getDefaultCredentials = () => {
  if (!config.features.showDefaultCredentials) {
    return null;
  }
  
  return {
    email: config.auth.defaultEmail,
    password: config.auth.defaultPassword
  };
};

/**
 * Logger levels and configuration
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_CATEGORIES = {
  INIT: 'INIT',
  PLAYBACK: 'PLAYBACK',
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  PROGRESS: 'PROGRESS',
  UI: 'UI',
  ERROR: 'ERROR',
  PERF: 'PERF'
};

const LOG_CONFIG = {
  level: config.isDevelopment ? LOG_LEVELS.TRACE : LOG_LEVELS.WARN,
  enableColors: true,
  enableGrouping: true,
  maxLogLength: 1000
};

/**
 * Core logging utility with structured output
 */
const createLogger = (level, levelName, color, icon) => {
  return (category, message, ...args) => {
    if (level > LOG_CONFIG.level) return;
    
    const timestamp = new Date().toISOString().substr(11, 12);
    const categoryStr = typeof category === 'string' ? category : LOG_CATEGORIES.DEBUG;
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    // Truncate very long messages
    const truncatedMessage = messageStr.length > LOG_CONFIG.maxLogLength 
      ? messageStr.substr(0, LOG_CONFIG.maxLogLength) + '...'
      : messageStr;
    
    const prefix = `${icon} [${levelName}] [${categoryStr}] ${timestamp}`;
    
    if (typeof window !== 'undefined' && LOG_CONFIG.enableColors) {
      if (messageStr.includes('===') && LOG_CONFIG.enableGrouping) {
        console.group(`%c${prefix} ${truncatedMessage}`, `color: ${color}; font-weight: bold;`);
        args.forEach(arg => {
          if (typeof arg === 'object') {
            console.log(JSON.stringify(arg, null, 2));
          } else {
            console.log(arg);
          }
        });
        console.groupEnd();
      } else {
        console.log(`%c${prefix}`, `color: ${color};`, truncatedMessage, ...args);
      }
    } else {
      console.log(prefix, truncatedMessage, ...args);
    }
  };
};

/**
 * Enhanced logging functions with categories
 */
export const logger = {
  error: createLogger(LOG_LEVELS.ERROR, 'ERROR', '#ff4444', '❌'),
  warn: createLogger(LOG_LEVELS.WARN, 'WARN', '#ffaa00', '⚠️'),
  info: createLogger(LOG_LEVELS.INFO, 'INFO', '#0066cc', 'ℹ️'),
  debug: createLogger(LOG_LEVELS.DEBUG, 'DEBUG', '#666666', '🔍'),
  trace: createLogger(LOG_LEVELS.TRACE, 'TRACE', '#888888', '📝')
};

/**
 * Backward compatibility exports
 */
export const debugLog = (message, ...args) => {
  if (typeof message === 'string' && message.includes('===')) {
    logger.info(LOG_CATEGORIES.DEBUG, message, ...args);
  } else {
    logger.debug(LOG_CATEGORIES.DEBUG, message, ...args);
  }
};

export const errorLog = (message, ...args) => {
  logger.error(LOG_CATEGORIES.ERROR, message, ...args);
};

export const warnLog = (message, ...args) => {
  logger.warn(LOG_CATEGORIES.ERROR, message, ...args);
};

/**
 * Enhanced performance logger with timing and memory tracking
 */
export const perfLog = {
  start: (operation) => {
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    logger.trace(LOG_CATEGORIES.PERF, `🚀 Starting: ${operation}`);
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = Math.round((endTime - startTime) * 100) / 100;
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const memoryDelta = endMemory - startMemory;
        
        const memoryStr = performance.memory 
          ? ` | Memory: ${memoryDelta > 0 ? '+' : ''}${Math.round(memoryDelta / 1024)}KB`
          : '';
        
        logger.info(LOG_CATEGORIES.PERF, `⏱️ Completed: ${operation} (${duration}ms${memoryStr})`);
        
        return { duration, memoryDelta };
      }
    };
  }
};

/**
 * Network request logger
 */
export const networkLog = {
  request: (method, url, headers = {}) => {
    logger.info(LOG_CATEGORIES.NETWORK, `📤 ${method} ${url}`, { headers });
  },
  response: (method, url, status, responseTime, responseSize = null) => {
    const statusIcon = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
    const sizeStr = responseSize ? ` | ${Math.round(responseSize / 1024)}KB` : '';
    logger.info(LOG_CATEGORIES.NETWORK, `📥 ${statusIcon} ${method} ${url} - ${status} (${responseTime}ms${sizeStr})`);
  },
  error: (method, url, error, responseTime) => {
    logger.error(LOG_CATEGORIES.NETWORK, `💥 ${method} ${url} failed (${responseTime}ms)`, error);
  }
};

/**
 * Audio-specific logging utilities
 */
export const audioLog = {
  state: (state, details = {}) => {
    logger.info(LOG_CATEGORIES.PLAYBACK, `🎵 Audio state: ${state}`, details);
  },
  event: (event, data = {}) => {
    logger.debug(LOG_CATEGORIES.PLAYBACK, `🎶 Audio event: ${event}`, data);
  },
  error: (error, context = {}) => {
    logger.error(LOG_CATEGORIES.PLAYBACK, `🚫 Audio error: ${error}`, context);
  },
  position: (current, duration, percentage) => {
    logger.trace(LOG_CATEGORIES.PLAYBACK, `⏯️ Position: ${current}s/${duration}s (${percentage}%)`);
  }
};

// Export log categories for use in components
export { LOG_CATEGORIES };
