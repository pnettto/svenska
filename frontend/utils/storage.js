// LocalStorage utility functions
export const storage = {
    CACHE_KEY: 'swedishWords',
    PIN_AUTH_KEY: 'pinAuthenticated',
    INTERACTION_COUNT_KEY: 'interactionCount',

    // Get cached words
    getCachedWords() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Error reading cached words:', error);
            return null;
        }
    },

    // Save words to cache
    saveWords(words) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(words));
        } catch (error) {
            console.error('Error saving words:', error);
        }
    },

    // Get proxy API URL
    getProxyUrl() {
        return localStorage.getItem('apiBaseUrl') || 'https://svenska-new-tab-backend.fly.dev';
    },

    // Session Token Methods
    getSessionToken() {
        return localStorage.getItem(this.PIN_AUTH_KEY);
    },

    setSessionToken(token) {
        if (token) {
            localStorage.setItem(this.PIN_AUTH_KEY, token);
        } else {
            localStorage.removeItem(this.PIN_AUTH_KEY);
        }
    },

    isAuthenticated() {
        return !!this.getSessionToken();
    },

    getInteractionCount() {
        const count = localStorage.getItem(this.INTERACTION_COUNT_KEY);
        return count ? parseInt(count, 10) : 0;
    },

    incrementInteractionCount() {
        const current = this.getInteractionCount();
        localStorage.setItem(this.INTERACTION_COUNT_KEY, (current + 1).toString());
        return current + 1;
    },

    resetInteractionCount() {
        localStorage.setItem(this.INTERACTION_COUNT_KEY, '0');
    }
};
