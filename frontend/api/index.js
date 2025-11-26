import { request, getHeaders } from './request.js';
import { API_BASE_URL } from '../constants.js';

// ============================================
// Word API
// ============================================

export async function getAllWords() {
  const data = await request('/api/words');
  return data?.words;
}

export async function getWord(id) {
  return await request(`/api/words/${id}`);
}

export async function createWord(original, translation, examples = []) {
  return await request('/api/words', {
    method: 'POST',
    body: JSON.stringify({ original, translation, examples })
  });
}

export async function updateWord(id, original, translation, examples = []) {
  return await request(`/api/words/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ original, translation, examples })
  });
}

export async function deleteWord(id) {
  return await request(`/api/words/${id}`, { method: 'DELETE' });
}

export async function incrementReadCount(id) {
  return await request(`/api/words/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ incrementReadCount: true })
  });
}

export async function generateRandomWord() {
  try {
    return await request('/api/ai/generate-random-word', { method: 'POST' });
  } catch (error) {
    console.error('Error generating random word:', error);
    return null;
  }
}

// ============================================
// AI API
// ============================================

export async function generateExamples(swedishWord, englishTranslation, existingExamples = [], wordId = null) {
  const requestBody = {
    swedishWord,
    englishTranslation,
    ...(existingExamples.length > 0 && { existingExamples }),
    ...(wordId && { wordId })
  };

  return await request('/api/ai/generate-examples', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
}

export async function translate(text, sourceLang = 'sv', targetLang = 'en') {
  const data = await request('/api/ai/translate', {
    method: 'POST',
    body: JSON.stringify({ text, sourceLang, targetLang })
  });

  return data.translation;
}

// ============================================
// Auth API
// ============================================

export async function verifyPin(pin) {
  try {
    return await request('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return { valid: false };
  }
}

export async function verifyToken() {
  try {
    return await request('/api/auth/verify-token', {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false };
  }
}

export async function logout() {
  try {
    return await request('/api/auth/logout', {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false };
  }
}

// ============================================
// Speech API
// ============================================

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

// ============================================
// Utils API
// ============================================

export async function exportWords() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/utils/export`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to export words');
    }

    const blob = await response.blob();
    const filename = response.headers.get('Content-Disposition')
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || `svenska-ord-${new Date().toISOString().split('T')[0]}.csv`;

    return { blob, filename };
  } catch (error) {
    console.error('Error exporting words:', error);
    throw error;
  }
}
