const express = require('express');
const app = express();

// Single test route
app.get('/api/public/colleges', (req, res) => {
  console.log('📨 Colleges request received!');
  res.json({
    success: true,
    data: [{ name: 'Test College', code: 'TEST', location: 'Test Location' }]
  });
});

app.listen(8000, () => {
  console.log('✅ Minimal server running on port 8000');
});
