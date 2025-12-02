const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`📨 Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data: [] }));
});

server.listen(8000, () => {
  console.log('✅ Bare HTTP server running on port 8000');
});
