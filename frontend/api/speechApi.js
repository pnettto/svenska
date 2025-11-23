import { API_BASE_URL } from '../constants.js';
import { request } from './request.js';

// Speech/audio API functions

export async function generateSpeech(text) {
  try {
    const result = await request('/api/speech/tts', {
      method: 'POST',
      body: JSON.stringify({ text }),
      responseType: 'blob'
    });
    
    if (!result) return null;
    
    return {
      audioBlob: result.blob,
      speechFile: result.headers.get('X-Speech-File')
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
}

export function getSpeechUrl(filename) {
  return `${API_BASE_URL}/api/speech/${filename}`;
}
