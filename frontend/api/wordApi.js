import { request } from './request.js';

// Word-related API functions

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
    return await request('/api/generate-random-word', { method: 'POST' });
  } catch (error) {
    console.error('Error generating random word:', error);
    return null;
  }
}
