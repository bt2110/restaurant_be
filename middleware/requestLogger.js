// middleware/requestLogger.js

/** Request Logger Middleware */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log(`📝 Body: ${JSON.stringify(req.body)}`);
  console.log(`🔍 Query: ${JSON.stringify(req.query)}`);
  
  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    // Log response
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    // Call original send
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = requestLogger;
