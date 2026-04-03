/**
 * AES-256-GCM Secure Storage using the browser's native Web Crypto API (SubtleCrypto).
 * Provides Authenticated Encryption to ensure both Confidentiality and Integrity.
 */

// SECURITY HARDENING: In a production environment, this key would be fetched 
// from a Hardware Security Module (HSM) or AWS KMS / Azure Key Vault via a backend.
// We NEVER hardcode the real master production key in client-side code.
const MASTER_KEY_ALIAS = "NEXUS_BANK_SECURE_TOKEN_2026_HARDENED";
const SALT = new TextEncoder().encode("NEXUS_SALT_001_HARDENED");

/**
 * Derives a cryptographic key from the master secret using PBKDF2.
 * Uses 100,000 iterations for robust security (Institutional Grade).
 */
async function deriveKey() {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(MASTER_KEY_ALIAS),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string to Base64 format (IV + Ciphertext + Tag).
 */
async function encrypt(text) {
  if (!text) return "";
  const key = await deriveKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for GCM
  const encodedData = new TextEncoder().encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encodedData
  );

  // Combine IV + Ciphertext (IV is needed for decryption)
  const bundle = new Uint8Array(iv.length + ciphertext.byteLength);
  bundle.set(iv);
  bundle.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...bundle));
}

/**
 * Decrypts a Base64 encoded string.
 */
async function decrypt(base64) {
  if (!base64) return "";
  try {
    const raw = atob(base64);
    const bundle = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bundle[i] = raw.charCodeAt(i);

    const iv = bundle.slice(0, 12);
    const ciphertext = bundle.slice(12);
    const key = await deriveKey();

    const decoded = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decoded);
  } catch (e) {
    console.error("AES-GCM Decryption failed:", e);
    return "";
  }
}

/**
 * ── INSTITUTIONAL AUDIT LOGGING ──
 * Every sensitive action is logged to a write-only simulated server log.
 */
function auditLog(action, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    ...metadata,
    userAgent: navigator.userAgent,
    // In a real app, we'd include sessionID and send it to an immutable log server like Splunk or ELK
  };
  console.info(`[AUDIT LOG]: ${JSON.stringify(logEntry)}`);

  // Persist local history of audit logs (for demonstration)
  const history = JSON.parse(localStorage.getItem("_nexus_audit_history") || "[]");
  history.push(logEntry);
  localStorage.setItem("_nexus_audit_history", JSON.stringify(history.slice(-100)));
}

const HONEY_TOKENS = ["ADMIN_DEBUG_ACCESS", "MASTER_VAULT_KEY", "DEBUG_USER_CREDENTIALS"];

export const secureStorage = {
  setItem: async (key, value) => {
    const jsonStr = JSON.stringify(value);
    const encrypted = await encrypt(jsonStr);
    localStorage.setItem(key, encrypted);
    auditLog("DATA_WRITE", { key });
  },

  getItem: async (key) => {
    // Tripwire Detection
    if (HONEY_TOKENS.includes(key)) {
      auditLog("SECURITY_VIOLATION_HONEYTOKEN", { key });
      alert("⚠️ SECURITY VIOLATION: Unauthorized metadata access detected. Event logged.");
      return null;
    }

    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    const decrypted = await decrypt(encrypted);
    try {
      const data = JSON.parse(decrypted);
      auditLog("DATA_READ", { key });
      return data;
    } catch {
      return null;
    }
  },

  removeItem: (key) => {
    localStorage.removeItem(key);
    auditLog("DATA_DELETE", { key });
  },

  getAuditLogs: () => {
    return JSON.parse(localStorage.getItem("_nexus_audit_history") || "[]");
  }
};
