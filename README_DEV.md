# NexusBank - Developer Notes (Rough Work)

## Topic 4: Innovation & Practical Application
### Objectives:
1. **Behavioral Biometrics**: Track user input timing to identify "abnormal" behavior.
2. **Honey-Tokens**: Implement a "tripwire" in `secureStorage` to detect unauthorized data reads.
3. **Virtual Cards**: Create a prototype UI for disposable burner cards.
4. **AI Risk Scoring**: Implement a heuristic-based "Risk Engine" for payments.

### Innovative Features:
- **`src/utils/secureStorage.js`**: Monitor for access to a dummy key like `ADMIN_DEBUG_ACCESS`.
- **`src/pages/Payments.jsx`**: Add a `RiskScore` calculator based on amount and frequency.
- **`src/pages/Rewards.jsx`**: Maybe use this for the "Virtual Cards" prototype or a new `Cards.jsx`.
