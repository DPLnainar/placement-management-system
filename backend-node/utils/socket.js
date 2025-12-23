const { Server } = require("socket.io");

/**
 * Socket.IO Implementation
 * 
 * Handles real-time communication for:
 * - Verification status updates
 * - New job notifications
 * - Application feedback
 */

let io;

module.exports = {
    /**
     * Initialize Socket.IO
     * @param {Object} httpServer - The HTTP server instance
     * @returns {Object} io instance
     */
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('🔌 Socket: Client connected');

            // Allow clients to join rooms (e.g., student_123, college_456)
            socket.on('joinRoom', (room) => {
                socket.join(room);
                console.log(`🔌 Socket: Joined room ${room}`);
            });

            socket.on('disconnect', () => {
                // console.log('🔌 Socket: Client disconnected');
            });
        });

        return io;
    },

    /**
     * Get IO instance
     * @returns {Object} io instance
     */
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
