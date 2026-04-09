# 🧠 NexusBank: 11-Phase Security Transformation Roadmap (Detailed)

This document provides a granular, step-by-step roadmap to transform NexusBank from an academic prototype into a 10/10 Audit-Ready FinTech system.

---

## 🧱 PHASE 1: Backend Foundation (The Security Brain)
**Goal**: Establish a trusted execution environment.

1.  **Project Initialization**: Create `/server` directory and run `npm init -y`.
2.  **Dependency Installation**: Install `express`, `helmet`, `cors`, `dotenv`, `express-rate-limit`, `morgan`.
3.  **Security Middleware**:
    - Configure **Helmet.js** to enforce strict DNS Prefetch Control, Frameguard, and HSTS.
    - Implement **Rate-Limit Tiers**: 
        - Auth endpoints: 5 req / 5 min.
        - Payment endpoints: 10 req / min.
        - General API: 100 req / 15 min.
4.  **Anomaly Tracer**: Initialize an in-memory (or DB) "Failure Counter" to track suspicious IP activity.

---

## 🛡️ PHASE 2: Database Hardening (Supabase Migration v3)
**Goal**: Moving access control to the source of truth (PostgreSQL).

1.  **Schema Extension**:
    - Add `totp_secret`, `failed_logins`, `is_blocked`, `current_session_key` to `public.profiles`.
    - Add `previous_hash` and `signature` to `public.audit_logs`.
    - Create `public.security_events` for real-time threat logging.
2.  **Security Definer Functions**:
    - Create `private.has_role(TEXT)` to securely check user roles from the profiles table.
3.  **RLS Policy Overhaul**:
    - Update all banking tables (Accounts, Transactions) to only allow SELECT/UPDATE if `auth.uid() = user_id` AND `private.has_role()` is correct.
4.  **Audit Lockdown**: Deny all `public` INSERT/UPDATE on `audit_logs`. Only the `service_role` (backend) can write to this table.

---

## 🔐 PHASE 3: Zero-Trust Cryptography (Server-Side)
**Goal**: Centrally manage cryptographic material.

1.  **AES-256-GCM Service**: Implement a backend `CryptoService` to handle encryption.
2.  **Key Versioning**: 
    - Implement a key-lookup map supporting `v1`, `v2`, `v3` linked to `.env` secrets.
3.  **Application-Level Salting**:
    - Implement `bcrypt` (12 rounds) on the server for all derived material.
4.  **Secrets Verification**: Ensure that raw keys NEVER leave the `CryptoService` memory space.

---

## 🔗 PHASE 4: Forensic Audit Integrity (Hash Chaining)
**Goal**: Design a tamper-evident audit trail.

1.  **Hash Chaining Service**: Implement a service that:
    - Fetches the `hash` of the last record.
    - Computes `SHA-256(last_hash + current_data + timestamp)`.
2.  **Integrity Checker**: Implement a background worker that validates the chain every hour and logs a `CHAIN_INTEGRITY_SUCCESS` or `CHAIN_INTEGRITY_FAILURE` security event.
3.  **UI Verification**: Add a "Verified Audit Trail" badge in the frontend that calls the integrity checker.

---

## 🔑 PHASE 5: Bank-Grade Auth (TOTP & Session Binding)
**Goal**: Secure identity and session context.

1.  **TOTP Integration**: Install `otplib`. Implement `POST /api/auth/mfa/setup` and `POST /api/auth/mfa/verify`.
2.  **Session Binding (Fingerprinting)**:
    - Generate `SHA-256(IP + User-Agent + SecretHash)` at login.
    - Embed this fingerprint check in every backend request.
3.  **Risk-Based Access**: If the IP changes significantly (Geo-shift), trigger a mandatory MFA re-challenge before allowing transactions.

---

## 💳 PHASE 6: Transaction Security (HMAC Signing)
**Goal**: Prevent replay and payload tampering.

1.  **Signing Service**: Backend generates a unique `signing_secret` per session (stored in DB/Session).
2.  **Client-Request Integrity**:
    - All payments must include an `x-nexus-signature` header.
    - Signature = `HMAC-SHA256(payload + nonce + timestamp, session_secret)`.
3.  **Replay Detection**: Reject any nonce already used or any timestamp older than 120 seconds.

---

## 🚿 PHASE 7: Anomaly Detection & Alerts
**Goal**: Real-time response to threats.

1.  **Alert Service**: Implement a centralized `AlertService` that logs to the `security_events` table.
2.  **Trigger Rules**:
    - 5 Failed logins = Account Lockout.
    - Invalid Session Fingerprint = Session Invalidation.
    - Transaction > 1,00,000 = Admin Alert.
3.  **Mock Alert Delivery**: Simulate email/SMS alerts via console logs or a mock dashboard.

---

## 🚀 PHASE 8: Frontend Refactor & API Proxying
**Goal**: Strip the UI of any "Security Intelligence."

1.  **Remove Direct Supabase Calls**: Replace all sensitive `supabase.from('...')` calls with `fetch('/api/...')`.
2.  **Encryption Wrapper Cleanup**: Delete local AES/RSA logic. Redirect to Backend API `/api/crypto/decrypt`.
3.  **MFA UI Flow**: Update the login flow to handle the "Pending MFA" state gracefully with a dedicated TOTP input screen.

---

## 🌐 PHASE 9: Web Security & CSP (Removing Inline Risks)
**Goal**: Eliminate XSS and script-injection vectors.

1.  **Tailwind Local Setup**:
    - `npm install tailwindcss postcss autoprefixer`.
    - Move all utility classes to a compiled CSS bundle.
2.  **Meta Tag Cleanup**: Remove the Tailwind CDN script from `index.html`.
3.  **Strict CSP**: Update `netlify.toml` / `index.html` to:
    - `script-src 'self'`.
    - `style-src 'self' 'unsafe-inline'`.
    - `default-src 'self'`.

---

## 📜 PHASE 10: Compliance & Backup Execution
**Goal**: Operational resilience.

1.  **Disaster Recovery Plan**: Document steps for "Key Compromise" and "Database Restore."
2.  **Encrypted Backups**:
    - Implement a script to generate a JSON dump of the database.
    - Encrypt the dump using a separate "Master Backup Key."
3.  **Privacy/Terms**: Add official-looking Privacy and Terms of Service components in the footer.

---

## 🧪 PHASE 11: Final Testing & Verification
**Goal**: Proving the 10/10 status.

1.  **Penetration Simulation**:
    - Attempt to modify a balance via direct DB injection; verify the Hash Chain detects it.
    - Capture a payment request and try to resubmit it; verify the Nonce check blocks it.
2.  **Key Rotation Test**: Manually rotate the master key on the backend and verify zero data loss.
3.  **Final Scorecard**: Generate the final audit artifact.
