const { createClient } = require('redis');
const config = require('./config');

class RedisSessionStore {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            return;
        }

        try {
            this.client = createClient({
                url: config.redis.url,
                socket: {
                    connectTimeout: 5000,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis connection failed after 10 retries');
                            return new Error('Redis connection failed');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            this.client.on('connect', () => {
                console.log('Redis connected');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                console.log('Redis disconnected');
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    // Create a new session
    async create(token, sessionData) {
        if (!this.isConnected) {
            await this.connect();
        }

        const session = {
            token,
            ...sessionData,
            createdAt: Date.now()
        };

        const ttl = Math.floor((sessionData.expiresAt - Date.now()) / 1000);
        
        if (ttl > 0) {
            await this.client.setEx(
                `session:${token}`,
                ttl,
                JSON.stringify(session)
            );
        }

        return session;
    }

    // Get a session by token
    async get(token) {
        if (!this.isConnected) {
            await this.connect();
        }

        const data = await this.client.get(`session:${token}`);
        
        if (!data) {
            return null;
        }

        const session = JSON.parse(data);

        // Double-check expiration
        if (session.expiresAt < Date.now()) {
            await this.delete(token);
            return null;
        }

        return session;
    }

    // Delete a session
    async delete(token) {
        if (!this.isConnected) {
            await this.connect();
        }

        await this.client.del(`session:${token}`);
    }

    // Check if a session exists and is valid
    async has(token) {
        const session = await this.get(token);
        return session !== null;
    }

    // Get all active sessions (for debugging/admin)
    async getAll() {
        if (!this.isConnected) {
            await this.connect();
        }

        const keys = await this.client.keys('session:*');
        const sessions = [];

        for (const key of keys) {
            const data = await this.client.get(key);
            if (data) {
                sessions.push(JSON.parse(data));
            }
        }

        return sessions;
    }

    // Clear all sessions
    async clear() {
        if (!this.isConnected) {
            await this.connect();
        }

        const keys = await this.client.keys('session:*');
        if (keys.length > 0) {
            await this.client.del(keys);
        }
    }

    // Health check
    async ping() {
        if (!this.isConnected) {
            return false;
        }
        
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
const sessionStore = new RedisSessionStore();

module.exports = sessionStore;
