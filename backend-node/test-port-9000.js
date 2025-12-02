const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`📨 Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Test server on 9000' }));
});

const port = 9000;
server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
