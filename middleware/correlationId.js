/** Correlation ID Middleware - Request tracing */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// Middleware to add correlation ID to request
const correlationIdMiddleware = (req, res, next) => {
  // Check if correlation ID exists in request header
  const correlationId = req.get('X-Correlation-ID') || uuidv4();
  
  // Attach to request for use in controllers
  req.correlationId = correlationId;
  
  // Set response header so client can track
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Log incoming request
  logger.http(req, req.method, req.path, {
    correlationId
  });
  
  next();
};

module.exports = correlationIdMiddleware;
