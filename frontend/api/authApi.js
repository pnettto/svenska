import { request } from './request.js';

// Auth-related API functions

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
