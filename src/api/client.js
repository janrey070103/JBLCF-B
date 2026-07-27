const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

export function resolveApiUrl(endpoint) {
  if (/^(?:https?:|data:|blob:)/i.test(endpoint)) {
    return endpoint;
  }

  if (!API_BASE_URL) {
    return endpoint;
  }

  return endpoint.startsWith('/')
    ? `${API_BASE_URL}${endpoint}`
    : `${API_BASE_URL}/${endpoint}`;
}

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const requestUrl = resolveApiUrl(endpoint);

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is FormData, don't set Content-Type (browser will set it with boundary)
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const res = await fetch(requestUrl, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Global 401 interceptor — JWT expired or revoked.
    // Clear session and dispatch an event so AuthProvider redirects to /login.
    if (res.status === 401 && endpoint !== '/api/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('session:expired'));
      throw new Error('Your session has expired. Please log in again.');
    }

    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch (e) {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  // If response is empty (e.g. 204 or some creates)
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}
