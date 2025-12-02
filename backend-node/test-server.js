require('dotenv').config();
const app = require('./server');

// Override console error to ensure it's captured
const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, args);
};

// Comprehensive error handling
process.on('error', (err) => {
  console.error('Process error:', err);
});

process.on('warning', (warning) => {
  console.warn('Warning:', warning);
});
