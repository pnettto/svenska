import { BASE_URL } from './config.js';

// Speech/audio API functions
// Note: Uses direct fetch for blob responses

export async function generateSpeech(text) {
  try {
    const response = await fetch(`${BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) return null;
    
    return {
      audioBlob: await response.blob(),
      speechFile: response.headers.get('X-Speech-File')
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
}

export function getSpeechUrl(filename) {
  return `${BASE_URL}/api/speech/${filename}`;  
}
