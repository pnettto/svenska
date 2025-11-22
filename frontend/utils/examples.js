// Examples generation and management utilities
import { audio } from './audio.js';
import { api } from './api.js';

export const examples = {
    // Fetch new examples from the API
    async fetch(proxyUrl, word, translation, existingExamples = [], wordId = null) {
        const requestBody = {
            swedishWord: word,
            englishTranslation: translation,
            ...(existingExamples.length > 0 && { existingExamples })
        };
        
        // Add wordId if it exists
        if (wordId) {
            requestBody.wordId = wordId;
        }
        
        // Use api.request which includes auth headers
        return await api.request('/api/generate-examples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
    },

    // Preload audio for a list of examples
    preloadAudio(examplesList, proxyUrl) {
        examplesList.forEach((example) => {
            audio.preloadExample(example, proxyUrl);
        });
    }
};
