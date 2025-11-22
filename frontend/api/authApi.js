import { request } from './request.js';

// Auth-related API functions

export async function verifyPin(pin) {
  try {
    return await request('/api/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return { valid: false };
  }
}

export async function verifyToken(token) {
  try {
    return await request('/api/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false };
  }
}
