// API utility functions for interacting with the backend
export const api = {
    BASE_URL: 'http://localhost:3000/api',

    // Get all words
    async getAllWords() {
        try {
            const response = await fetch(`${this.BASE_URL}/words`);
            if (!response.ok) {
                throw new Error(`Failed to fetch words: ${response.status}`);
            }
            const data = await response.json();
            return data.words;
        } catch (error) {
            console.error('Error fetching words:', error);
            return null;
        }
    },

    // Get single word by ID
    async getWord(id) {
        try {
            const response = await fetch(`${this.BASE_URL}/words/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch word: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching word:', error);
            return null;
        }
    },

    // Create new word
    async createWord(original, translation, examples = []) {
        try {
            const response = await fetch(`${this.BASE_URL}/words`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original,
                    translation,
                    examples
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to create word: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating word:', error);
            return null;
        }
    },

    // Update word
    async updateWord(id, original, translation, examples = []) {
        try {
            const response = await fetch(`${this.BASE_URL}/words/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original,
                    translation,
                    examples
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to update word: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating word:', error);
            return null;
        }
    },

    // Delete word
    async deleteWord(id) {
        try {
            const response = await fetch(`${this.BASE_URL}/words/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`Failed to delete word: ${response.status}`);
            }
            return true;
        } catch (error) {
            console.error('Error deleting word:', error);
            return false;
        }
    },

    // Increment read count
    async incrementReadCount(id) {
        try {
            const response = await fetch(`${this.BASE_URL}/words/${id}/increment-read`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Failed to increment read count: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error incrementing read count:', error);
            return null;
        }
    },

    // Get statistics
    async getStats() {
        try {
            const response = await fetch(`${this.BASE_URL}/stats`);
            if (!response.ok) {
                throw new Error(`Failed to fetch stats: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
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
