/**
 * AES-256-GCM Secure Storage using the browser's native Web Crypto API (SubtleCrypto).
 * Provides Authenticated Encryption to ensure both Confidentiality and Integrity.
 */

const MASTER_PWD = "NEXUS_BANK_SECURE_TOKEN_2026_HARDENED";
const SALT = new TextEncoder().encode("NEXUS_SALT_001");

/**
 * Derives a cryptographic key from the master password using PBKDF2 (Password-Based Key Derivation Function 2).
 * Use 100,000 iterations for robust security.
 */
async function deriveKey() {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(MASTER_PWD),
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

const STORAGE_KEY = "nexusbank_user";
const HONEY_TOKENS = ["ADMIN_DEBUG_ACCESS", "MASTER_VAULT_KEY", "DEBUG_USER_CREDENTIALS"];

export const secureStorage = {
  // Now uses async/await safely
  setItem: async (key, value) => {
    const jsonStr = JSON.stringify(value);
    const encrypted = await encrypt(jsonStr);
    localStorage.setItem(key, encrypted);
  },

  getItem: async (key) => {
    // INNOVATION: Honey-Token Detection (Tripwire)
    if (HONEY_TOKENS.includes(key)) {
      console.warn("SECURITY ALERT: Unauthorized access to Honey-Token detected:", key);
      alert("⚠️ SECURITY VIOLATION: Unauthorized metadata access detected. This event has been logged for manual investigation.");
      // In a real app, this would notify the SOC (Security Operations Center)
      return null;
    }

    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    const decrypted = await decrypt(encrypted);
    try {
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  },

  removeItem: (key) => localStorage.removeItem(key),
};
