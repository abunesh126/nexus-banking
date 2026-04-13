#!/usr/bin/env bash
set -euo pipefail

# deploy_azure_function.sh
# Usage:
#   ./scripts/deploy_azure_function.sh <RESOURCE_GROUP> <LOCATION> <STORAGE_ACCOUNT> <FUNCTION_APP_NAME>
# Example:
#   ./scripts/deploy_azure_function.sh nexus-rg eastus nexusstorageacct my-nexus-func

if [ "$#" -ne 4 ]; then
  echo "Usage: $0 <RESOURCE_GROUP> <LOCATION> <STORAGE_ACCOUNT> <FUNCTION_APP_NAME>"
  exit 2
fi

RG="$1"
LOCATION="$2"
STORAGE="$3"
APPNAME="$4"

echo "Ensure you're logged into Azure: az login"

echo "Creating resource group: $RG in $LOCATION (idempotent)"
az group create -n "$RG" -l "$LOCATION"

echo "Creating storage account: $STORAGE (must be globally unique and lowercase)"
az storage account create -n "$STORAGE" -g "$RG" -l "$LOCATION" --sku Standard_LRS

echo "Creating Function App: $APPNAME"
az functionapp create --resource-group "$RG" \
  --consumption-plan-location "$LOCATION" \
  --name "$APPNAME" \
  --storage-account "$STORAGE" \
  --runtime node --runtime-version 18 --functions-version 4

# Zip deploy the functions folder
TMPZIP="/tmp/${APPNAME}_functions.zip"
cd "$(dirname "$0")/.." || exit 1
zip -r "$TMPZIP" azure-functions -x "**/node_modules/**" "**/.venv/**"

echo "Deploying (zip) to Function App: $APPNAME"
az functionapp deployment source config-zip --resource-group "$RG" --name "$APPNAME" --src "$TMPZIP"

# Add CORS for local dev (vite default port)
az functionapp cors add --name "$APPNAME" --resource-group "$RG" --allowed-origins http://localhost:5173

echo "Deployed. Your function should be available at: https://$APPNAME.azurewebsites.net/api/CurrencyConverter"

echo "Next: copy that URL into .env.local as VITE_AZURE_FUNC_URL=\"https://$APPNAME.azurewebsites.net/api/CurrencyConverter\" and restart the dev server."

# cleanup
rm -f "$TMPZIP"

echo "Done."
