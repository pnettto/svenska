import { BASE_URL } from './config.js';

// Auth-related API functions
// Note: These don't use the shared request() because they need custom error handling

export async function verifyPin(pin) {
  try {
    const response = await fetch(`${BASE_URL}/api/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    if (!response.ok) return { valid: false };
    return await response.json();
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return { valid: false };
  }
}

export async function verifyToken(token) {
  try {
    const response = await fetch(`${BASE_URL}/api/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (!response.ok) return { valid: false };
    return await response.json();
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false };
  }
}
