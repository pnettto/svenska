const { Redis } = require('@upstash/redis')
const config = require('./config');

class RedisSessionStore {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
            if (this.isConnected && this.client) {
                return;
            }
            try {
                this.client = new Redis({
                    url: config.redis.url,
                    token: config.redis.token
                });
                this.isConnected = true;
            } catch (error) {
                console.error('Failed to initialize Redis client:', error);
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
            await this.client.set(
                `session:${token}`,
                JSON.stringify(session),
                { ex: ttl }
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
