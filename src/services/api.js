// Module-level token storage (NOT localStorage)
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken() {
  return accessToken;
}

const BASE_URL = '/api'; // Uses Vite proxy in dev

async function request(method, url, data = null, options = {}) {
  const headers = {};

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
    credentials: 'include', // Send cookies for refresh token
    ...options,
  };

  if (data) {
    config.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  let response = await fetch(`${BASE_URL}${url}`, config);

  // If 401 and we have a token, try refreshing
  if (response.status === 401 && accessToken) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      config.headers = headers;
      response = await fetch(`${BASE_URL}${url}`, config);
    } else {
      // Refresh failed — clear token, redirect to login
      clearAccessToken();
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || errorData.message || `Error ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  // Handle blob responses (CSV export)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  return response.json();
}

async function refreshToken() {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      accessToken = data.accessToken;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Public API methods
export const api = {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, data),
  put: (url, data) => request('PUT', url, data),
  patch: (url, data) => request('PATCH', url, data),
  delete: (url) => request('DELETE', url),
};

// File upload helper (multipart/form-data)
export async function apiUpload(url, formData) {
  return request('POST', url, formData);
}

export default api;
