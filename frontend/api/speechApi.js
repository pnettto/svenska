import { api } from '../utils/api.js';

// Speech/audio API functions
export async function generateSpeech(text) {
  return await api.generateSpeech(text);
}

export function getSpeechUrl(filename) {
  return api.getSpeechUrl(filename);
}
