# 🔐 Database Lockdown (Role Hardening)

---

## 2. Overview
Financial databases must adhere to the principle of "Default-Deny." Most cloud-native databases come with default `public` or `authenticated` roles that have broad access. NexusBank performs a **Database Lockdown** by explicitly revoking all privileges from standard roles. Only the Backend Proxy (Security Brain), using a high-authority secret key, can interact with the data layer.

---

## 3. Privilege Hierarchy Diagram

```mermaid
graph TD
    subgraph Public_Internet
        UA[Anonymous User]
        AU[Authenticated User]
    end

    subgraph Database_Engine [PostgreSQL (Supabase)]
        Role_Public[Role: public / anon]
        Role_Auth[Role: authenticated]
        Role_SVC[Role: service_role]
        Data[(Hardened Tables)]
    end

    UA -->|1. Try Access| Role_Public
    AU -->|2. Try Access| Role_Auth
    
    Role_Public -->|X. REVOKED| Data
    Role_Auth -->|X. REVOKED| Data
    
    Role_SVC -->|3. ALLOW (Full Authority)| Data
    SB[Security Brain Proxy] -->|4. Use Service Key| Role_SVC
```

---

## 4. Threat Model
*   **Attack Prevented**: Anonymous Scraping and Token-Privilege Exploitation.
*   **Scenario (Public Access)**: An attacker uses their own regular account JWT and attempts to use the Supabase JS library to query `supabase.from('profiles').select('*')` to download the entire user database.
*   **Result**: Even though the user is "Logged In" (Authenticated), the database role `authenticated` has been stripped of all SELECT permissions. The query returns a `403 Forbidden` at the database level. Data only leaves the table when requested by the high-authority proxy-only `service_role`.

---

## 5. Implementation Details
*   **Mandatory Revocation**: All tables in the `public` schema have their default grants removed.
*   **Selective Authority**: Only the system's `service_role` (which never leaves the backend) is granted the bypass needed to manage ledgers.
- **Fail-Closed**: If a developer accidentally creates a new table, the system's default security rules prevent anyone from seeing it until explicitly locked down.

---

## 6. Code Snippets

### SQL: Hardening the Core Schema
```sql
-- server/database/harderning.sql

-- 1. Strip all default access from web roles
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- 2. Strip function execution privileges
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- 3. Strip Schema Usage (Final Lockdown)
REVOKE USAGE ON SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM authenticated;

-- 4. Verify: Only service_role can see the profiles
ALTER TABLE public.profiles OWNER TO postgres;
```

---

## 7. Security Benefits
*   **Deep Barrier**: Protection is enforced at the database kernel level, not just the application level.
*   **Elimination of API Harvesting**: Makes direct database endpoints useless to attackers.
- **Access Control Uniformity**: Centralizes all data movement through the Proxy where it can be audited (Doc 04).

---

## 8. Limitations / Notes
*   **Maintenance**: Requires admins to explicitly manage grants if using non-service custom roles.
*   **Dependency**: The entire platform relies on the secure storage of the `service_role` key in the backend environment.

---

## 9. Summary
Database Lockdown ensures that NexusBank's data is an "Impenetrable Box" by default. It removes all public paths to the data, ensuring that the only way for information to move is through the verified, non-bypassable logic of the Security Brain.
