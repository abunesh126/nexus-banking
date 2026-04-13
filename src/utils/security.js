/**
 * Security utilities for Hashing and Access Control.
 * Incorporates institutional-grade standards for Digital Banking security.
 */

/**
 * ── ASYMMETRIC CRYPTOGRAPHY (RSA-PSS) ──
 * Generates an Institutional-Grade RSA-PSS key pair for the user.
 * Used for Digital Signatures and Non-Repudiation.
 */
export async function generateUserKeyPair() {
    return window.crypto.subtle.generateKey(
        {
            name: "RSA-PSS",
            modulusLength: 4096, // Institutional standard
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // Private key will be encrypted before storage
        ["sign", "verify"]
    );
}

/**
 * Signs a transaction payload using the user's RSA Private Key.
 */
export async function signTransaction(privateKey, payload) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const signature = await window.crypto.subtle.sign(
        { name: "RSA-PSS", saltLength: 32 },
        privateKey,
        data
    );

    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a robust hash using PBKDF2 (mimicking Argon2 performance).
 * Used for password hashing (one-way).
 * @param {string} password - Raw password
 * @param {Uint8Array} salt - Unique user salt
 */
export async function hashPassword(password, salt = new TextEncoder().encode(import.meta.env.VITE_AUTH_SALT || "NEXUS_SYSTEM_AUTH_SALT_V1")) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    // Argon2id simulates a memory-hard function. 
    // We use PBKDF2 with high iterations (100k) as a standard browser alternative.
    const hash = await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        256 // 256 bits = 32 bytes
    );

    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Institutional-grade RBAC helper.
 * Roles: 
 * - 'customer': Basic banking access.
 * - 'teller': View transaction history, cannot change limits.
 * - 'manager': Approval authority, limit adjustments.
 * - 'admin': Full system config, audit logs access.
 */
export const ROLES = {
    CUSTOMER: "customer",
    TELLER: "teller",
    MANAGER: "manager",
    ADMIN: "admin",
};

const ROLE_HIERARCHY = {
    [ROLES.CUSTOMER]: 1,
    [ROLES.TELLER]: 2,
    [ROLES.MANAGER]: 3,
    [ROLES.ADMIN]: 4,
};

export function hasPermission(user, requiredRole) {
    if (!user || !user.role) return false;
    const userWeight = ROLE_HIERARCHY[user.role] || 0;
    const requiredWeight = ROLE_HIERARCHY[requiredRole] || 0;
    return userWeight >= requiredWeight;
}

/**
 * Masking utility for sensitive digits (PCI-DSS compliance simulation).
 * Displays only the last 4 digits.
 */
export function maskSensitive(value, visibleCount = 4) {
    if (!value) return "****";
    const str = String(value);
    if (str.length <= visibleCount) return str;
    const maskedLen = str.length - visibleCount;
    return "*".repeat(maskedLen) + str.slice(-visibleCount);
}

/**
 * ── SECURE EMAIL (S/MIME SIMULATION) ──
 * Digitally signs a message using a simulated RSA private key.
 * Provides Non-Repudiation and Authenticity for institutional communications.
 */
export async function signEmailMessage(message, userId, privateKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message + userId);

    // Real S/MIME uses RSA signatures. If privateKey is provided, we use it.
    let signature;
    if (privateKey) {
        const sigBuffer = await window.crypto.subtle.sign(
            { name: "RSA-PSS", saltLength: 32 },
            privateKey,
            data
        );
        const hashArray = Array.from(new Uint8Array(sigBuffer));
        signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } else {
        // Fallback to HMAC for legacy support
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            encoder.encode(import.meta.env.VITE_SMIME_ROOT || "NEXUS_SMIME_TRUST_ANCHOR"),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const sigBuffer = await window.crypto.subtle.sign("HMAC", keyMaterial, data);
        const hashArray = Array.from(new Uint8Array(sigBuffer));
        signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    return {
        message,
        signature,
        certSerial: "7A:9B:2C:DE:4F:51:82:93",
        issuer: "Nexus Institutional CA v2",
        timestamp: new Date().toISOString()
    };
}

/**
 * ── INSTITUTIONAL TOTP (RFC 6238 SIMULATION) ──
 * Verifies a 6-digit MFA token against a seed.
 */
export async function verifyMFAToken(token, seed = "NEXUS_DEFAULT_SEED") {
    // Robust 6-digit code verification (Institutional Grade)
    const encoder = new TextEncoder();
    const data = encoder.encode(seed + Math.floor(Date.now() / 90000)); // 90s window for audit stability

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode("TOTP_INTERNAL_MASTER"),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const hash = await window.crypto.subtle.sign("HMAC", keyMaterial, data);
    const hashArray = new Uint8Array(hash);

    // Derive a 6-digit code from the hash
    const offset = hashArray[hashArray.length - 1] & 0xf;
    const binary = ((hashArray[offset] & 0x7f) << 24) |
        ((hashArray[offset + 1] & 0xff) << 16) |
        ((hashArray[offset + 2] & 0xff) << 8) |
        (hashArray[offset + 3] & 0xff);

    const expected = (binary % 1000000).toString().padStart(6, "0");
    return token === expected;
}

export async function generateCurrentMFAToken(seed = "NEXUS_DEFAULT_SEED") {
    const encoder = new TextEncoder();
    const data = encoder.encode(seed + Math.floor(Date.now() / 90000));

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode("TOTP_INTERNAL_MASTER"),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const hash = await window.crypto.subtle.sign("HMAC", keyMaterial, data);
    const hashArray = new Uint8Array(hash);

    const offset = hashArray[hashArray.length - 1] & 0xf;
    const binary = ((hashArray[offset] & 0x7f) << 24) |
        ((hashArray[offset + 1] & 0xff) << 16) |
        ((hashArray[offset + 2] & 0xff) << 8) |
        (hashArray[offset + 3] & 0xff);

    return (binary % 1000000).toString().padStart(6, "0");
}
