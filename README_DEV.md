# NexusBank - Developer Notes (Rough Work)

## Topic 4: Innovation & Practical Application
### Objectives:
1. **Behavioral Biometrics**: Track user input timing to identify "abnormal" behavior.
2. **Honey-Tokens**: Implement a "tripwire" in `secureStorage` to detect unauthorized data reads.
3. **Virtual Cards**: Create a prototype UI for disposable burner cards.
4. **AI Risk Scoring**: Implement a heuristic-based "Risk Engine" for payments.

### Innovative Features:

## Azure Function (CurrencyConverter) — Deploy & Wire-up

Easiest: use the VS Code Azure Functions extension.

1. Install the Azure Functions extension in VS Code.
2. Click the Azure icon in the VS Code sidebar.
3. Under the "Workspace" section, click the Deploy button (upward arrow) and select the `azure-functions` folder in this repo.
4. Choose your Azure Subscription and the Function App target.
5. After deployment completes, open the Azure Portal, navigate to your Function App -> Functions -> `CurrencyConverter` -> Get Function URL.
6. Create a local `.env.local` (or update your environment) with:

	VITE_AZURE_FUNC_URL="https://<your-app>.azurewebsites.net/api/CurrencyConverter"

7. Restart the dev server (Vite) so `import.meta.env` picks up the new value.

Pro-Tip: The code in `src/context/BankContext.jsx` will automatically use the configured `VITE_AZURE_FUNC_URL`. If it's missing, the app falls back to a safe simulated conversion so the UI remains functional.

See `.env.example` for a template.

### Application Insights (optional) — automated setup script

If you want Application Insights wired automatically to your Function App, there's a helper script under `azure-functions/scripts/setup_appinsights.sh`.

Usage:

	./azure-functions/scripts/setup_appinsights.sh <RESOURCE_GROUP> <LOCATION> <APP_INSIGHTS_NAME> <FUNCTION_APP_NAME>

The script will create the App Insights resource (if missing), fetch the connection string, set the `APPLICATIONINSIGHTS_CONNECTION_STRING` app setting on the Function App, and restart it.

Note: You still need the Azure CLI (`az`) and to be logged in. The script performs idempotent operations.

### Alternative: Deploy from CLI (zip deploy)

If you prefer to deploy from your machine using Azure CLI, there's a helper script:

	./scripts/deploy_azure_function.sh <RESOURCE_GROUP> <LOCATION> <STORAGE_ACCOUNT> <FUNCTION_APP_NAME>

The script will:
- create the resource group (if missing)
- create a storage account
- create a Node.js Function App
- zip and deploy the `azure-functions` folder
- add a CORS rule for local Vite dev (http://localhost:5173)

Before running, ensure you are logged in: `az login` and your subscription is selected. After deploy, copy the function URL into `.env.local` as `VITE_AZURE_FUNC_URL="https://<app>.azurewebsites.net/api/CurrencyConverter"` and restart your dev server.
