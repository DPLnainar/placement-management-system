const { createClient } = require('redis');

/**
 * Redis Client Service
 * 
 * Provides a connection to Redis for caching.
 * Includes graceful fallback to "No Cache" mode if Redis is not available or crashes.
 * This ensures the application never crashes even if the cache layer fails.
 */

let client = null;
let isConnected = false;

// Initialize Redis Client
const initRedis = async () => {
    if (client) return client;

    try {
        const url = process.env.REDIS_URI || 'redis://localhost:6379';
        console.log(`🔌 Attempting to connect to Redis at ${url}...`);

        client = createClient({
            url: url,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        console.log('❌ Redis: Max retries reached. Caching disabled.');
                        return new Error('Max retries reached');
                    }
                    console.log(`🔄 Redis: Reconnecting (attempt ${retries})...`);
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        client.on('error', (err) => {
            console.error('❌ Redis Client Error:', err.message);
            isConnected = false;
        });

        client.on('connect', () => {
            console.log('✅ Redis: Connected successfully');
            isConnected = true;
        });

        client.on('end', () => {
            console.log('⚠️  Redis: Connection closed');
            isConnected = false;
        });

        await client.connect();

    } catch (err) {
        console.warn('⚠️  Redis: Connection failed. Running in NO-CACHE mode.');
        // Don't throw - allow app to run without cache
        isConnected = false;
    }

    return client;
};

// Start connection (can be called at server startup)
initRedis();

const redisService = {
    /**
     * Get value from cache
     * @param {string} key 
     * @returns {Promise<any|null>}
     */
    get: async (key) => {
        if (!isConnected || !client) return null;
        try {
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error(`SimpleCache GET error for ${key}:`, err.message);
            return null;
        }
    },

    /**
     * Set value in cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds 
     */
    set: async (key, value, ttlSeconds = 3600) => {
        if (!isConnected || !client) return;
        try {
            await client.set(key, JSON.stringify(value), {
                EX: ttlSeconds
            });
        } catch (err) {
            console.error(`SimpleCache SET error for ${key}:`, err.message);
        }
    },

    /**
     * Delete value from cache
     * @param {string} key 
     */
    del: async (key) => {
        if (!isConnected || !client) return;
        try {
            await client.del(key);
        } catch (err) {
            console.error(`SimpleCache DEL error for ${key}:`, err.message);
        }
    },

    /**
     * Check if Redis is healthy
     */
    isHealthy: () => isConnected
};

module.exports = redisService;
