import { API_BASE_URL } from '../constants.js';

// Storage keys
const STORAGE_KEYS = {
    CACHE: 'swedishWords',
    SESSION_TOKEN: 'sessionToken',
    INTERACTION_COUNT: 'interactionCount',
    API_BASE_URL: 'apiBaseUrl',
};

// LocalStorage utility functions
export const storage = {
    // Get cached words
    getCachedWords() {
        try {
            const cached = localStorage.getItem(STORAGE_KEYS.CACHE);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Error reading cached words:', error);
            return null;
        }
    },

    // Save words to cache
    saveWords(words) {
        try {
            localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(words));
        } catch (error) {
            console.error('Error saving words:', error);
        }
    },

    // Get proxy API URL
    getProxyUrl() {
        return localStorage.getItem(STORAGE_KEYS.API_BASE_URL) || API_BASE_URL;
    },

    // Session Token Methods
    getSessionToken() {
        return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    },

    setSessionToken(token) {
        if (token) {
            localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
        } else {
            localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
        }
    },

    isAuthenticated() {
        return !!this.getSessionToken();
    },

    getInteractionCount() {
        const count = localStorage.getItem(STORAGE_KEYS.INTERACTION_COUNT);
        return count ? parseInt(count, 10) : 0;
    },

    incrementInteractionCount() {
        const current = this.getInteractionCount();
        localStorage.setItem(STORAGE_KEYS.INTERACTION_COUNT, (current + 1).toString());
        return current + 1;
    },

    resetInteractionCount() {
        localStorage.setItem(STORAGE_KEYS.INTERACTION_COUNT, '0');
    }
};
