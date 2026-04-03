/**
 * Security utilities for Hashing and Access Control.
 * Incorporates institutional-grade standards for Digital Banking security.
 */

/**
 * Generates a robust hash using PBKDF2 (mimicking Argon2 performance).
 * Used for password hashing (one-way).
 * @param {string} password - Raw password
 * @param {Uint8Array} salt - Unique user salt
 */
export async function hashPassword(password, salt = new TextEncoder().encode("GLOBAL_NEXUS_SALT")) {
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
