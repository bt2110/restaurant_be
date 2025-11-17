/** Winston Logger - Professional logging with levels and structure */

const chalk = require('chalk');

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

const LOG_COLORS = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  fatal: chalk.bgRed.white
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase() || 'info'];

// Format timestamp as ISO string
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message with metadata
const formatLogMessage = (level, message, correlationId = null, context = {}) => {
  const timestamp = getTimestamp();
  const corrId = correlationId ? ` [${correlationId}]` : '';
  const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
  
  return `${timestamp}${corrId} [${level.toUpperCase()}] ${message}${contextStr}`;
};

// Internal log function - writes to console
const log = (level, message, correlationId = null, context = {}) => {
  if (LOG_LEVELS[level] < CURRENT_LOG_LEVEL) {
    return; // Skip if level is lower than current log level
  }

  const formatted = formatLogMessage(level, message, correlationId, context);
  const colored = LOG_COLORS[level](formatted);

  if (level === 'error' || level === 'fatal') {
    console.error(colored);
  } else {
    console.log(colored);
  }
};

// Logger object with all logging methods
const logger = {
  // Debug level logging - For development details
  debug: (message, options = {}) => {
    log('debug', message, options.correlationId, options.context || {});
  },

  // Info level logging - For general information
  info: (message, options = {}) => {
    log('info', message, options.correlationId, options.context || {});
  },

  // Warn level logging - For warnings and potential issues
  warn: (message, options = {}) => {
    log('warn', message, options.correlationId, options.context || {});
  },

  // Error level logging - For application errors
  error: (message, options = {}) => {
    const context = options.context || {};
    if (options.error) {
      context.error = options.error.message;
      context.stack = options.error.stack?.split('\n').slice(0, 3); // First 3 stack lines
    }
    log('error', message, options.correlationId, context);
  },

  // Fatal level logging - For critical errors requiring shutdown
  fatal: (message, options = {}) => {
    const context = options.context || {};
    if (options.error) {
      context.error = options.error.message;
      context.stack = options.error.stack?.split('\n').slice(0, 5);
    }
    log('fatal', message, options.correlationId, context);
  },

  // Log HTTP request (usually called from middleware)
  http: (req, method, path, params = {}) => {
    const correlationId = req.correlationId || req.id;
    
    // Remove sensitive fields
    const safeParams = { ...params };
    ['password', 'token', 'authorization', 'secret'].forEach(field => {
      if (safeParams[field]) {
        safeParams[field] = '***REDACTED***';
      }
    });

    log('info', `HTTP ${method} ${path}`, correlationId, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')?.substring(0, 50),
      params: Object.keys(safeParams).length > 0 ? safeParams : undefined
    });
  },

  // Log database operation
  database: (operation, model, duration, correlationId = null, success = true) => {
    const level = success ? 'info' : 'warn';
    log(level, `DB ${operation} ${model} (${duration}ms)`, correlationId, {
      success,
      duration
    });
  },

  // Log business logic action
  action: (action, details = {}) => {
    log('info', `ACTION: ${action}`, details.correlationId, {
      userId: details.userId,
      ...details.context
    });
  },

  // Get current log level
  getLevel: () => {
    return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === CURRENT_LOG_LEVEL);
  }
};

module.exports = logger;
