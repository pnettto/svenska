// Word management and navigation utilities
import { translate as translateApi } from '../api/index.js';

export const words = {
    // Translate a Swedish word to English
    async translate(proxyUrl, swedish) {
        return await translateApi(swedish, 'sv', 'en');
    }
};
