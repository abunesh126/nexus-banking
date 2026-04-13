# 🏛️ NexusBank: Institutional Security & Cloud Intelligence

NexusBank is a high-maturity, security-first banking application designed for institutional-grade compliance and cloud-native resilience. The platform integrates advanced AI risk analytics, secure ETL pipelines, and a hardened zero-trust architecture.

---

## 🚀 Cloud-Native Evolution (Assessment Summary)

### 📊 Topic 1: Managed Cloud Dataset & ETL
*   **Source**: Automated data ingestion from **Azure Blob Storage (V2)**.
*   **Orchestration**: A Python-based ETL pipeline fetches historical ledger data from a secure `ledger` container.
*   **Secure Auth**: Utilizes time-limited **SAS Tokens (Shared Access Signatures)** for least-privilege cloud data access, ensuring no PII is exposed to the public internet.
*   **Normalization**: Transaction data is automatically normalized, risk-scored, and ingested into the Postgres persistence layer.

### 🧠 Topic 3: Managed Cloud ML (AI)
*   **Engine**: Integrated with **Azure Cognitive Services (Anomaly Detector v3)**.
*   **Inference**: Performs live heuristic analysis on ledger records using the Microsoft West-US Datacenter.
*   **Result Analysis**: The system automatically flags "Statistical Deviations" (Anomalies) such as high-velocity transfers or blacklisted merchant categories with a **96/100 risk score**.
*   **UI Integration**: Institutional "AI Insights" dashboard provides real-time visibility into machine learning risk assessments.

---

## 🛡️ Security Posture

-   **MFA (Multi-Factor Authentication)**: Secured with a 4-digit Safe-Token system with visual cryptographic banners.
-   **AES-256-GCM Encryption**: All sensitive `localStorage` data is encrypted using the Web Crypto API.
-   **RBAC (Role-Based Access Control)**: Enforced via Supabase Auth and context-aware routing.
-   **Honey-Token Tripwires**: Automated detection of unauthorized data access attempts via cryptographic "traps."
-   **Institutional Auditing**: A decentralized SOC Audit Log tracks all encryption, auth, and data events with log integrity verification.

---

## 🛠️ DevOps & CI/CD Pipeline

The application follows an **Immutable Infrastructure** pattern for maximum reliability:
*   **Dockerization**: Multi-stage Docker builds ensure identical environments from development to production.
    *   **Stage 1**: React build with build-time secret injection.
    *   **Stage 2**: Production-hardened Nginx server.
*   **GitHub Actions**: Automated pipeline triggers on every push to `main`:
    1.  **Security Scan**: Dependency check.
    2.  **Containerize**: Build Docker image.
    3.  **Deploy**: Pushes the image to **Azure Container Registry (ACR)** and updates the **Azure Container App**.

---

## 📈 Monitoring & Observability
Managed via the **Azure Portal** (`Nexus_Banking` resource group):
*   **Metrics**: Real-time traffic, CPU, and CPU monitoring for the container.
*   **AI Health**: Request tracking for Cognitive Services.
*   **Audit Trail**: Local forensic logs are synchronized with cloud security dashboards.

---

## 💻 Tech Stack
-   **Frontend**: React (Vite) + TailwindCSS + Lucide Icons
-   **Backend/Auth**: Supabase (PostgreSQL)
-   **Cloud**: Microsoft Azure (Storage, AI, Container Apps)
-   **Security**: AES-256-GCM, PBKDF2, Web Crypto API
-   **Container**: Docker + Nginx

---
*Nexus SOC · Institutional Grade Monitoring · Log Integrity Verified*
