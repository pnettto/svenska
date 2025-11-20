// Examples generation and management utilities
import { audio } from './audio.js';

export const examples = {
    // Fetch new examples from the API
    async fetch(proxyUrl, word, translation, existingExamples = []) {
        const response = await fetch(`${proxyUrl}/api/generate-examples`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                swedishWord: word,
                englishTranslation: translation,
                ...(existingExamples.length > 0 && { existingExamples })
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        return await response.json();
    },

    // Preload audio for a list of examples
    preloadAudio(examplesList, proxyUrl) {
        examplesList.forEach(example => {
            audio.preload(example.swedish, proxyUrl);
        });
    }
};
