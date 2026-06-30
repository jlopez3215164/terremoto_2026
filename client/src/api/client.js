export const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : '/api';

export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = { ...options.headers };
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Algo salió mal en la solicitud');
  }

  return response.json();
}
