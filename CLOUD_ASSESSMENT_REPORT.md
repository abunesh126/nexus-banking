# NexusBank — Cloud Assessment Professional Report
**Target Grade:** Excellent (30/30)

---

## 🏛️ 1. Cloud Architecture & Pipeline Implementation
**Status:** Completed (Excellent Candidate)

### **Infrastructure Overview**
- **Cloud Provider:** Microsoft Azure
- **Compute:** Azure Container Apps (Serverless Containers)
- **Registry:** Azure Container Registry (Private Image Storage)
- **Delivery:** GitHub Actions CI/CD Pipeline

### **Technical Troubleshooting Log (The "Learning" Proof)**
During implementation, the following architecture challenges were overcome:
1.  **Resource Provider Registration:** Resolved `Microsoft.App` registration latency in the student subscription.
2.  **Cross-Service Authentication:** Fixed 401 Unauthorized errors by linking the Container App to the ACR via an Admin Secret handshake.
3.  **Vite Build Environment Isolation:** Implemented Docker `--build-arg` injection to ensure Supabase credentials are "baked" into the static JS bundle at build-time.
4.  **Runtime Compatibility:** Switched the base image from `Alpine` to `Debian` to resolve the `nvidia-container-cli: ldconfig` initialization hook failure in the South India data center.

---

## 🏗️ 2. Active Development Issues (Current Bugs)
The following issues were identified in the final web console logs and require resolution:
1.  **React ReferenceError:** `useState is not defined` in the dashboard component. 
    *   *Fix:* Ensure React hooks are correctly imported in all JSX files.
2.  **Supabase Constraint Violation (Error 23503):** Foreign key mismatch on `user_id` when creating a new record.
    *   *Fix:* Ensure the `users` table is populated before inserting related audit logs or transaction records.

---

## 🚀 3. Future Roadmap: The Path to "Excellent"
To fully satisfy the remaining rubric targets, the following Azure-native integrations are planned:

### **Topic 3: Managed ML & Analytics Services**
- **Proposal:** Integrate **Azure Cognitive Services (Content Moderator)** to sanitize banking comments or **Azure Anomaly Detector** to flag high-risk transactions.
- **Rubric Link:** "Result Analysis using Managed Cloud ML."

### **Topic 2: Serverless Function Implementation**
- **Proposal:** Deploy an **Azure Function** (Python/Node) to handle currency conversion rates or secure MFA code generation.
- **Rubric Link:** "Serverless function (AWS Lambda / Azure Functions) implemented."

### **Topic 1: Cloud Dataset & ETL Workflow**
- **Proposal:** Use **Azure Blob Storage** to host a `transactions.csv` dataset and implement a **Logic App** to ingest this into the Supabase database.
- **Rubric Link:** "Dataset ingested from cloud sources... ETL workflow."

---

## 📊 4. Conclusion
The current architecture establishes a professional, scalable foundation. The transition from local development to a Dockerized, Cloud-Native deployment validates the core requirements of the ASE and DIS course modules.

**Lead Architect:** Franz (Collaborator/Student)  
**Assisting AI:** Antigravity (Advanced Agentic Coding Agent)  
**Date:** April 10, 2026
