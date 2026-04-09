const BACKEND_URL = 'http://localhost:8001/api';

/**
 * Hardened API Client (Phase 9.5 - Zero-Trust Validator)
 * - No symmetric secrets stored client-side.
 * - Performs structural and freshness validation (Anti-Replay).
 * - Backend remains the sole cryptographic authority.
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
      handleSecurityFailure();
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

    // 4. SAFE RESPONSE VALIDATION (Zero-Trust Model)
    const result = await response.json();
    
    try {
      validateResponse(result);
    } catch (err) {
      console.error(`SECURITY_VIOLATION: ${err.message}`);
      handleSecurityFailure();
      throw err;
    }

    return result.data;

  } catch (err) {
    if (err.name === 'AbortError') throw new Error('API_TIMEOUT');
    throw err;
  }
}

/**
 * Zero-Trust Validator: Checks freshness and structure.
 * Does NOT perform cryptographic verification using shared secrets.
 */
function validateResponse(response) {
  // 1. Timestamp freshness (anti-replay) - Reject if > 10s old
  const ageInMs = Date.now() - response.timestamp;
  if (!response.timestamp || ageInMs > 10000 || ageInMs < -5000) {
    throw new Error("REPLAY_DETECTED");
  }

  // 2. Basic schema validation
  if (!response.data || typeof response.data !== "object") {
    throw new Error("INVALID_PAYLOAD");
  }

  // 3. Nonce presence
  if (!response.nonce) {
    throw new Error("MISSING_NONCE");
  }

  return true;
}

/**
 * Protective Logout: Clears all local state and forces a fresh reload.
 */
function handleSecurityFailure() {
  localStorage.removeItem("nexus_session");
  // Use reload to clear all in-memory states
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login?reason=SECURITY_FAILURE';
  } else {
    window.location.reload();
  }
}

export const apiClient = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};
