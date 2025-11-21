// Word management and navigation utilities
export const words = {
    // Translate a Swedish word to English
    async translate(proxyUrl, swedish) {
        const response = await fetch(`${proxyUrl}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: swedish, sourceLang: 'sv', targetLang: 'en' })
        });

        if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
        
        const data = await response.json();
        return data.translation;
    }
};
