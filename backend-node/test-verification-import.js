// Quick test to see if verificationController can be imported
import('../src/controllers/verificationController')
    .then(() => console.log('✅ verificationController loaded successfully'))
    .catch(err => console.error('❌ Error loading verificationController:', err.message));

import('../src/routes/verificationRoutes')
    .then(() => console.log('✅ verificationRoutes loaded successfully'))
    .catch(err => console.error('❌ Error loading verificationRoutes:', err.message));
