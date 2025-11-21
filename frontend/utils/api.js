// API utility functions for interacting with the backend
export const api = {
    BASE_URL: localStorage.getItem('apiBaseUrl') || 'https://svenska-new-tab-backend.fly.dev',

    // Helper for making API requests
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            return options.method === 'DELETE' ? true : await response.json();
        } catch (error) {
            console.error(`Error with ${endpoint}:`, error);
            return null;
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
