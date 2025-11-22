// Word management and navigation utilities
import { api } from './api.js';

export const words = {
    // Translate a Swedish word to English
    async translate(proxyUrl, swedish) {
        const data = await api.request('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: swedish, sourceLang: 'sv', targetLang: 'en' })
        });
        
        return data.translation;
    }
};
