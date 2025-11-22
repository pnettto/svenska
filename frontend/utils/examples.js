// Examples generation and management utilities
import { audio } from './audio.js';
import { generateExamples } from '../api/aiApi.js';

export const examples = {
    // Fetch new examples from the API
    async fetch(proxyUrl, word, translation, existingExamples = [], wordId = null) {
        return await generateExamples(word, translation, existingExamples, wordId);
    },

    // Preload audio for a list of examples
    preloadAudio(examplesList, proxyUrl) {
        examplesList.forEach((example) => {
            audio.preloadExample(example, proxyUrl);
        });
    }
};
