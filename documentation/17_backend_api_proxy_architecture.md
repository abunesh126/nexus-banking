# 🔐 Backend API Proxy Architecture (Isolation)

---

## 2. Overview
Most modern cloud applications allow the client (browser) to talk directly to the database services using a public key. NexusBank explicitly rejects this for a **Proxy-Only Architecture**. Every single request must pass through the **Security Brain (Express)**. This ensures that the database schema, internal methods, and high-privilege keys stay hidden from the public web.

---

## 3. Topography Diagram

```mermaid
graph LR
    subgraph Client_Zone [Client Zone]
        Browser[User Browser]
    end

    subgraph Security_Perimeter [Security Perimeter]
        SB[Security Brain Proxy]
        Logic[Business Logic]
        Audit[Forensic Logger]
    end

    subgraph Core_Vault [Core Vault]
        DB[(PostgreSQL / Supabase)]
    end

    Browser -->|1. Request (No DB Key)| SB
    SB -->|2. Verification Pipeline| Logic
    Logic -->|3. Record Event| Audit
    Logic -->|4. Authorized SQL Query| DB
    DB -->|5. Raw Data| Logic
    Logic -->|6. Sanitize & Sign| SB
    SB -->|7. Secure Response| Browser

    Browser -.->|X. BLOCKED| DB
```

---

## 4. Threat Model
*   **Attack Prevented**: Schema Harvesting, direct DB scraping, and Service Key Extraction.
*   **Scenario (Direct Access)**: An attacker finds the project's database URL in a log file. They attempt to use the `admin-role` keys they found in a leaked repo to query the `profiles` table.
*   **Result**: Even if the attacker has a key, the database endpoint is restricted to only allow traffic from the **Security Brain's** specific IP. Furthermore, the `service_role` key never exists on the user's device. Forcing data through the proxy gives the bank 100% control over WHAT results are returned and HOW often.

---

## 5. Implementation Details
*   **Credential Encapsulation**: The high-authority `SUPABASE_SERVICE_ROLE_KEY` is strictly a server-side environment variable.
*   **Endpoint Transformation**: The client calls `/api/v1/profile`. The proxy translates this to a specific, optimized, and filtered SQL query, preventing the user from seeing the raw table structure.
*   **Mandatory Inspection**: The proxy inspects every payload for type-safety and overflows before it reaches the data layer.

---

## 6. Code Snippets

### Backend: Private Database Client
```js
// server/lib/supabaseAdmin.js
const { createClient } = require('@supabase/supabase-js');

// This client has absolute authority but is ONLY available in the backend
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Never leaked to frontend
);

module.exports = { supabaseAdmin };
```

### Backend: Service Mapping
```js
// server/routes/transactions.js
router.get('/history', authMiddleware, async (req, res) => {
    // 1. The Proxy translates the generic intent
    // into a specific, safe Postgres query.
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('id, amount, status, created_at')
        .eq('user_id', req.user.id); // Automatic isolation

    if (error) return res.status(500).end();

    // 2. Wrap and return (Doc 14)
    res.json(data);
});
```

---

## 7. Security Benefits
*   **Information Hiding**: Prevents attackers from learning about internal table names, column types, or hidden metadata.
*   **Centralized Analytics**: Allows for real-time monitoring of all data access patterns in one bottleneck.
- **Protocol Control**: The proxy can enforce caching, response signing, and data masking (Doc 21) in a unified way.

---

## 8. Limitations / Notes
*   **Performance**: Adds network latency to every call as a "Middleman."
*   **Proxy Bottleneck**: If the proxy is overloaded, the entire bank goes down (requires high-availability scaling).

---

## 9. Summary
By placing the Security Brain as a mandatory proxy between the user and the database, NexusBank ensures that its core data remains isolated and protected by a robust, non-bypassable intelligence layer.
