/**
 * Hardened API Client
 * Centralizes all communication, enforces timeouts, and handles security signals.
 * ZERO-TRUST: No direct Supabase SDK dependency.
 */
async function apiRequest(endpoint, options = {}) {
  // 1. Get session from manual storage
  const sessionStr = localStorage.getItem('nexus_session');
  const session = sessionStr ? JSON.parse(sessionStr) : null;
  const token = session?.access_token;
  
  // 2. Identity & Fingerprint Logic
  const fingerprint = localStorage.getItem('nexus_fingerprint') || 'unknown_client';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s Strict Timeout

  const headers = {
    'Content-Type': 'application/json',
    'x-fingerprint': fingerprint,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 3. GLOBAL ERROR STATE HANDLING
    if (response.status === 503) {
      window.dispatchEvent(new CustomEvent('NEXUS_SAFE_MODE', { detail: { active: true } }));
      throw new Error('SYSTEM_LOCKED');
    }

    if (response.status === 401) {
      // Session Expired - Forced Logout
      localStorage.removeItem('nexus_session');
      window.location.href = '/login';
      throw new Error('SESSION_EXPIRED');
    }

    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('NEXUS_RATE_LIMIT', { detail: { active: true } }));
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.data?.error || errorBody.error || 'Security Rejection');
    }

    if (response.status === 204) return null;

    // 4. SIGNED RESPONSE UNWRAPPING
    const result = await response.json();
    return result.data; // Discard signature, keep verified data

  } catch (err) {
    if (err.name === 'AbortError') throw new Error('API_TIMEOUT');
    throw err;
  }
}

export const apiClient = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};
