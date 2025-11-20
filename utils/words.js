// Word management and navigation utilities
import { api } from './api.js';

export const words = {
    // Translate a Swedish word to English
    async translate(proxyUrl, swedish) {
        const response = await fetch(`${proxyUrl}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: swedish,
                sourceLang: 'sv',
                targetLang: 'en'
            })
        });

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
        }

        const data = await response.json();
        return data.translation;
    },

    // Initialize words from cache or API
    async initialize(proxyUrl, storage) {
        // Wake up proxy server (non-blocking)
        fetch(`${proxyUrl}/health`).catch(error => {
            console.warn('Failed to wake up proxy server:', error);
        });

        // Try to get cached words first
        const cachedWords = storage.getCachedWords();
        const initialWords = cachedWords ? api.shuffle(cachedWords) : null;

        // Fetch fresh words from API in background
        api.getAllWords().then(freshWords => {
            if (freshWords) {
                storage.saveWords(freshWords);
            }
        });

        return initialWords;
    }
};
