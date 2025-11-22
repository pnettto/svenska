// API utility functions for interacting with the backend
export const api = {
    BASE_URL: localStorage.getItem('apiBaseUrl') || 'https://svenska-new-tab-backend.fly.dev',

    // Get headers with session token if available
    getHeaders(includeAuth = true) {
        const headers = { 'Content-Type': 'application/json' };
        
        if (includeAuth) {
            const token = localStorage.getItem('pinAuthenticated');
            if (token && token !== 'true' && token !== 'false') {
                headers['x-session-token'] = token;
            }
            
            // Also send interaction count for rate limiting
            const count = localStorage.getItem('interactionCount') || '0';
            headers['x-interaction-count'] = count;
        }
        
        return headers;
    },

    // Helper for making API requests
    async request(endpoint, options = {}) {
        try {
            // Merge custom headers with auth headers
            const headers = {
                ...this.getHeaders(),
                ...(options.headers || {})
            };
            
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                ...options,
                headers
            });
            
            // Handle authentication errors
            if (response.status === 401) {
                const data = await response.json().catch(() => ({}));
                throw { authError: true, code: data.code, message: data.error };
            }
            
            // Handle 204 No Content
            if (response.status === 204) {
                return true;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API error: ${response.status}`);
            }
            
            return options.method === 'DELETE' ? true : await response.json();
        } catch (error) {
            console.error(`Error with ${endpoint}:`, error);
            throw error;
        }
    },

    // Get all words
    async getAllWords() {
        const data = await this.request('/api/words');
        return data?.words;
    },

    // Get single word by ID
    async getWord(id) {
        return await this.request(`/api/words/${id}`);
    },

    // Create new word
    async createWord(original, translation, examples = []) {
        return await this.request('/api/words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ original, translation, examples })
        });
    },

    // Update word
    async updateWord(id, original, translation, examples = []) {
        return await this.request(`/api/words/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ original, translation, examples })
        });
    },

    // Update word
    async updateWord(id, original, translation, examples = []) {
        return await this.request(`/api/words/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ original, translation, examples })
        });
    },

    // Delete word
    async deleteWord(id) {
        return await this.request(`/api/words/${id}`, { method: 'DELETE' });
    },

    // Increment read count
    async incrementReadCount(id) {
        return await this.request(`/api/words/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incrementReadCount: true })
        });
    },

    // Get statistics
    async getStats() {
        return await this.request('/api/stats');
    },

    // Generate speech for text and get audio blob
    async generateSpeech(text) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) return null;
            
            return {
                audioBlob: await response.blob(),
                speechFile: response.headers.get('X-Speech-File')
            };
        } catch (error) {
            return null;
        }
    },

    // Get cached audio URL by filename
    getSpeechUrl(filename) {
        return `${this.BASE_URL}/api/speech/${filename}`;
    },

    // Generate random Swedish word with AI
    async generateRandomWord() {
        try {
            const response = await fetch(`${this.BASE_URL}/api/generate-random-word`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Error generating random word:', error);
            return null;
        }
    },

    // Verify PIN and get session token
    async verifyPin(pin) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            
            if (!response.ok) return { valid: false };
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error verifying PIN:', error);
            return { valid: false };
        }
    },

    // Verify session token
    async verifyToken(token) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/verify-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (!response.ok) return { valid: false };
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error verifying token:', error);
            return { valid: false };
        }
    },

    // Shuffle array using Fisher-Yates algorithm
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
