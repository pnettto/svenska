import { request } from './request.js';

// AI-related API functions

export async function generateExamples(swedishWord, englishTranslation, existingExamples = [], wordId = null) {
  const requestBody = {
    swedishWord,
    englishTranslation,
    ...(existingExamples.length > 0 && { existingExamples }),
    ...(wordId && { wordId })
  };
  
  return await request('/api/generate-examples', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
}

export async function translate(text, sourceLang = 'sv', targetLang = 'en') {
  const data = await request('/api/translate', {
    method: 'POST',
    body: JSON.stringify({ text, sourceLang, targetLang })
  });
  
  return data.translation;
}
