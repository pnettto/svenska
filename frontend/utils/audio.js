// Audio playback utilities
export const audio = {
    cache: {},
    currentAudio: null,

    // Generate audio using /api/tts and return the speech filename
    async generateAudio(text, proxyUrl) {
        try {
            const response = await fetch(`${proxyUrl}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const speechFile = response.headers.get('X-Speech-File');
            
            // Cache the audio
            if (speechFile) {
                this.cache[speechFile] = audioUrl;
            }
            this.cache[text] = audioUrl;
            
            return { audioUrl, speechFile };
        } catch (error) {
            console.error('Error generating audio:', error);
            throw error;
        }
    },

    // Get audio URL (from cache or speech endpoint)
    getAudioUrl(speechFilename, proxyUrl) {
        if (this.cache[speechFilename]) {
            return this.cache[speechFilename];
        }
        
        const audioUrl = `${proxyUrl}/api/speech/${speechFilename}`;
        this.cache[speechFilename] = audioUrl;
        return audioUrl;
    },

    // Preload audio for a word
    async preloadWord(word, proxyUrl) {
        const cacheKey = word.speech || word.original;
        
        if (this.cache[cacheKey]) {
            return;
        }
        
        try {
            if (word.speech) {
                // Use cached audio from speech endpoint
                this.getAudioUrl(word.speech, proxyUrl);
            } else {
                // Generate new audio
                await this.generateAudio(word.original, proxyUrl);
            }
        } catch (error) {
            console.error('Error preloading word audio:', error);
        }
    },

    // Preload audio for an example
    async preloadExample(example, proxyUrl) {
        const cacheKey = example.speech || example.swedish;
        
        if (this.cache[cacheKey]) {
            return;
        }
        
        try {
            if (example.speech) {
                // Use cached audio from speech endpoint
                this.getAudioUrl(example.speech, proxyUrl);
            } else {
                // Generate new audio
                await this.generateAudio(example.swedish, proxyUrl);
            }
        } catch (error) {
            console.error('Error preloading example audio:', error);
        }
    },

    // Play audio for a word
    async playWord(word, proxyUrl) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        try {
            let audioUrl;
            
            if (word.speech) {
                audioUrl = this.getAudioUrl(word.speech, proxyUrl);
            } else {
                const result = await this.generateAudio(word.original, proxyUrl);
                audioUrl = result.audioUrl;
            }
            
            this.currentAudio = new Audio(audioUrl);
            await this.currentAudio.play();
            
        } catch (error) {
            console.error('Error playing word audio:', error);
            alert('Failed to play audio. Make sure your proxy server is running.');
        }
    },

    // Play audio for an example
    async playExample(example, word, exampleIndex, proxyUrl) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        try {
            let audioUrl;
            
            if (example.speech) {
                audioUrl = this.getAudioUrl(example.speech, proxyUrl);
            } else {
                const result = await this.generateAudio(example.swedish, proxyUrl);
                audioUrl = result.audioUrl;
            }
            
            this.currentAudio = new Audio(audioUrl);
            await this.currentAudio.play();
            
        } catch (error) {
            console.error('Error playing example audio:', error);
            alert('Failed to play example audio. Make sure your proxy server is running.');
        }
    }
};
