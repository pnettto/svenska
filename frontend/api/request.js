import { API_BASE_URL, STORAGE_KEYS } from '../constants.js';

// Get headers with session token if available
export function getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (includeAuth) {
    const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    if (token && token !== 'true' && token !== 'false') {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Helper for making API requests
export async function request(endpoint, options = {}) {
  try {
    // Merge custom headers with auth headers
    const headers = {
      ...getHeaders(),
      ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers
    });

    // Handle authentication errors
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      throw { authError: true, code: data.code, message: data.error };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return true;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    // Handle blob responses (for audio, images, etc.)
    if (options.responseType === 'blob') {
      return {
        blob: await response.blob(),
        headers: response.headers
      };
    }

    return options.method === 'DELETE' ? true : await response.json();
  } catch (error) {
    console.error(`Error with ${endpoint}:`, error);
    throw error;
  }
}
