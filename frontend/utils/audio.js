import { getHeaders } from '../api/request.js';

// Audio playback utilities
export const audio = {
    cache: {},
    currentAudio: null,

    // Generate audio using /api/tts and return the speech filename
    async generateAudio(text, proxyUrl) {
        try {
            const headers = getHeaders();
            const response = await fetch(`${proxyUrl}/api/speech/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('TTS failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const speechFile = response.headers.get('X-Speech-File');

            // Cache the audio
            if (speechFile) this.cache[speechFile] = audioUrl;
            this.cache[text] = audioUrl;

            return { audioUrl, speechFile };
        } catch (error) {
            console.error('Error generating audio:', error);
            throw error;
        }
    },

    // Get audio URL (from cache or speech endpoint)
    getAudioUrl(speechFilename, proxyUrl) {
        if (this.cache[speechFilename]) return this.cache[speechFilename];

        const audioUrl = `${proxyUrl}/api/speech/${speechFilename}`;
        this.cache[speechFilename] = audioUrl;
        return audioUrl;
    },

    // Preload audio helper
    async preloadAudio(speechFilename, text, proxyUrl) {
        const cacheKey = speechFilename || text;
        if (this.cache[cacheKey]) return;

        try {
            if (speechFilename) {
                this.getAudioUrl(speechFilename, proxyUrl);
            } else {
                await this.generateAudio(text, proxyUrl);
            }
        } catch (error) {
            console.error('Error preloading audio:', error);
        }
    },

    // Preload audio for a word
    async preloadWord(word, proxyUrl) {
        await this.preloadAudio(word.speech, word.original, proxyUrl);
    },

    // Preload audio for an example
    async preloadExample(example, proxyUrl) {
        await this.preloadAudio(example.speech, example.swedish, proxyUrl);
    },

    // Play audio helper
    async play(speechFilename, text, proxyUrl) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        try {
            const audioUrl = speechFilename
                ? this.getAudioUrl(speechFilename, proxyUrl)
                : (await this.generateAudio(text, proxyUrl)).audioUrl;

            this.currentAudio = new Audio(audioUrl);
            await this.currentAudio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            alert('Failed to play audio. Make sure your proxy server is running.');
        }
    },

    // Play audio for a word
    async playWord(word, proxyUrl) {
        await this.play(word.speech, word.original, proxyUrl);
    },

    // Play audio for an example
    async playExample(example, word, exampleIndex, proxyUrl) {
        await this.play(example.speech, example.swedish, proxyUrl);
    }
};
