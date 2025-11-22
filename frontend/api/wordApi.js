import { BASE_URL } from './config.js';
import { api } from '../utils/api.js';

// Word-related API functions

export async function getAllWords() {
  return await api.getAllWords();
}
export async function getWord(id) {
  return await api.getWord(id);
}
export async function createWord(original, translation, examples = []) {
  return await api.createWord(original, translation, examples);
}
export async function updateWord(id, original, translation, examples = []) {
  return await api.updateWord(id, original, translation, examples);
}
export async function deleteWord(id) {
  return await api.deleteWord(id);
}
export async function incrementReadCount(id) {
  return await api.incrementReadCount(id);
}
export async function generateRandomWord() {
  return await api.generateRandomWord();
}
