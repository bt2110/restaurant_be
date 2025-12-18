// middleware/requestLogger.js

/** Request Logger Middleware */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    // Store correlation ID from request
    const correlationId = req.correlationId || 'N/A';
    
    // Call original send
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
