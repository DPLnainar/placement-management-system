/**
 * Request Logging Middleware
 * 
 * Logs all incoming requests with timing and response status
 * Useful for debugging and monitoring
 */

const logger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`\n📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  if (req.user) {
    console.log(`👤 User: ${req.user.username} (${req.user.role})`);
  }
  
  if (Object.keys(req.query).length > 0) {
    console.log(`🔍 Query:`, req.query);
  }
  
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    // Don't log passwords
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.oldPassword) sanitizedBody.oldPassword = '***';
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = '***';
    console.log(`📦 Body:`, sanitizedBody);
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    const statusEmoji = res.statusCode >= 500 ? '❌' : 
                       res.statusCode >= 400 ? '⚠️' : 
                       res.statusCode >= 300 ? '↩️' : '✅';
    
    console.log(`${statusEmoji} [${res.statusCode}] ${req.method} ${req.path} - ${duration}ms\n`);
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = logger;
