import { API_BASE_URL } from '../constants.js';
import { getHeaders } from './request.js';

// Utils API functions

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
