const Datastore = require('nedb-promises');

// Initialize session database
// Use mounted volume on Fly.io (/data) or local file for development
const dbPath = process.env.FLY_APP_NAME 
    ? '/data/sessions.db' 
    : 'data/sessions.db';

const sessionsDb = Datastore.create({
    filename: dbPath,
    autoload: true,
    inMemoryOnly: false // Ensure we're using disk
});

// Force reload from disk before each operation
const reloadDb = async () => {
    return new Promise((resolve, reject) => {
        sessionsDb.loadDatabase((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Clean up expired sessions on startup
const cleanupExpiredSessions = async () => {
    const now = Date.now();
    await sessionsDb.remove({ expiresAt: { $lt: now } }, { multi: true });
};

// Run cleanup on startup
cleanupExpiredSessions();

// Clean up expired sessions periodically (every hour)
setInterval(async () => {
    await cleanupExpiredSessions();
}, 60 * 60 * 1000);

const sessionStore = {
    // Create a new session
    async create(token, sessionData) {
        await reloadDb(); // Reload from disk
        const session = {
            token,
            ...sessionData,
            createdAt: Date.now()
        };
        await sessionsDb.insert(session);
        return session;
    },

    // Get a session by token
    async get(token) {
        await reloadDb(); // Reload from disk
        const session = await sessionsDb.findOne({ token });
        
        if (!session) {
            return null;
        }

        // Check if session has expired
        if (session.expiresAt < Date.now()) {
            await this.delete(token);
            return null;
        }

        return session;
    },

    // Delete a session
    async delete(token) {
        await reloadDb(); // Reload from disk
        await sessionsDb.remove({ token }, {});
    },

    // Check if a session exists and is valid
    async has(token) {
        const session = await this.get(token);
        return session !== null;
    },

    // Get all active sessions (for debugging/admin)
    async getAll() {
        const now = Date.now();
        return await sessionsDb.find({ expiresAt: { $gte: now } });
    },

    // Clear all sessions
    async clear() {
        await sessionsDb.remove({}, { multi: true });
    }
};

module.exports = sessionStore;
