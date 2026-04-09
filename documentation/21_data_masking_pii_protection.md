# 🔐 Data Masking & PII Protection (Privacy)

---

## 2. Overview
Personally Identifiable Information (PII) is a high-value target for data harvesters. NexusBank implements **Dynamic Data Masking**—a security control that redacts sensitive identifiers (PAN numbers, Credit Card numbers, UPI IDs) at the display layer. This ensures that sensitive strings are only visible to the actual owner or a high-privilege administrator, adhering to PCI-DSS and GDPR standards.

---

## 3. Privacy Boundary Diagram

```mermaid
graph LR
    subgraph Storage_Zone
        Raw[Raw Data: sam@upi.com]
    end

    subgraph Masking_Engine
        Logic{User Role Check}
        Rule1[Admin: Show Raw]
        Rule2[User: Redact Center]
    end

    Raw --> Logic
    Logic --> Rule1
    Logic --> Rule2
    
    Rule1 -->|Cleartext| V1[SOC Dashboard]
    Rule2 -->|s***@upi.com| V2[Standard Transaction History]
```

---

## 4. Threat Model
*   **Attack Prevented**: Data Harvesting and Insider PII Leakage.
*   **Scenario**: A staff member logs into the support portal. They attempt to download a CSV of the last 1,000 transactions to sell the UPI IDs of active users to a marketing firm.
*   **Result**: Because the staff member does not have the `SUPERADMIN` role, the masking utility (Doc 21) automatically iterates through the export and redacts the sensitive merchant and recipient identifiers. The resulting file contains only useless, masked strings (e.g., `acc***23`), effectively neutralizing the value of the stolen data.

---

## 5. Implementation Details
*   **Context-Aware Redaction**: Masking logic is applied selectively based on the active `AuthContext`.
*   **RegEx Sanitization**: Uses pattern matching to identify UPI-style strings (`@upi`) and account numbers.
*   **Structural Integrity**: Masking preserves the format of the string (e.g., maintaining the `@domain`) to keep the UI functional while hiding the identity.

---

## 6. Code Snippets

### Frontend: The Multi-Pattern Masking Tool
```jsx
// src/utils/security.js

/**
 * Dynamically masks sensitive identifiers based on type patterns.
 */
export const maskPII = (val, role) => {
    if (!val || role === 'admin') return val;

    // Pattern 1: UPI / Email IDs
    if (val.includes('@')) {
        const [user, domain] = val.split('@');
        return `${user.slice(0, 2)}***@${domain}`;
    }

    // Pattern 2: Card / Account Numbers
    if (val.match(/^\d+$/)) {
      return `****${val.slice(-4)}`;
    }

    // Pattern 3: Generic Alpha-labels
    return `${val.slice(0, 3)}...`;
};
```

### React Component: Safe Rendering
```jsx
// src/components/TransactionCard.jsx
import { maskPII } from '../utils/security';

export default function TransactionCard({ transaction, user }) {
  // Apply mask in the view layer
  const maskedMerchant = maskPII(transaction.merchant, user.role);

  return (
    <div className="card">
      <span className="id">{maskedMerchant}</span>
      <span className="amt">₹{transaction.amount}</span>
    </div>
  );
}
```

---

## 7. Security Benefits
*   **Need-to-Know Enforcement**: Prevents accidental data exposure to unprivileged eyes.
*   **Minimization of Breach Impact**: Even a partial database leak of logs is less damaging if identifiers are pre-masked.
- **Legal Compliance**: Built-in adherence to financial privacy regulations (PCI-DSS).

---

## 8. Limitations / Notes
*   **Reversible Logic**: Masking strictly for display can be bypassed if the user has access to Browser Developer Tools and the API sends unmasked data. (For high-stakes PII, NexusBank masks at the API layer as well).
*   **Pattern Overlap**: Some strings may be misinterpreted as PII when they are not.

---

## 9. Summary
Data Masking is the "Identity Shield" of NexusBank. It ensures that sensitive user metadata is only visible under strict, authorized conditions, maintaining a privacy-first environment for every customer.
