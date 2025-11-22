import { api } from '../utils/api.js';

// Auth-related API functions
export async function verifyPin(pin) {
  return await api.verifyPin(pin);
}

export async function verifyToken(token) {
  return await api.verifyToken(token);
}
