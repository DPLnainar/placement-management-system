const redisClient = require('../utils/redisClient');

/**
 * Caching Middleware
 * 
 * @param {number} durationSeconds - Cache duration in seconds
 * @param {function} customKeyGenerator - Optional custom key generator
 */
const cache = (durationSeconds = 300, customKeyGenerator = null) => {
    return async (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key
            const key = customKeyGenerator
                ? customKeyGenerator(req)
                : `cache:${req.originalUrl || req.url}`;

            // Try to get cached response
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                // console.log(`🚀 Serving from cache: ${key}`);
                return res.json(cachedData);
            }

            // If not cached, override res.send/res.json to capture response
            const originalSend = res.json;

            res.json = (body) => {
                // Restore original method
                res.json = originalSend;

                // Cache the response asynchronously (fire and forget)
                if (body && body.success) { // Only cache successful responses
                    redisClient.set(key, body, durationSeconds);
                }

                // Send response
                return originalSend.call(res, body);
            };

            next();
        } catch (err) {
            console.error('Cache middleware error:', err);
            // Fallback to uncached response on error
            next();
        }
    };
};

module.exports = cache;
