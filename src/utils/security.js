/**
 * Security utilities for Hashing and Access Control.
 */

/**
 * Generates a SHA-256 hash of a string.
 * Used for password hashing (one-way).
 */
export async function hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Simple RBAC helper.
 */
export function hasPermission(user, requiredRole) {
    if (!user) return false;
    const roles = ["user", "verified", "admin"];
    return roles.indexOf(user.role) >= roles.indexOf(requiredRole);
}
