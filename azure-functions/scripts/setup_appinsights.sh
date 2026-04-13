#!/usr/bin/env bash
set -euo pipefail

# setup_appinsights.sh
# Usage:
#   ./azure-functions/scripts/setup_appinsights.sh <RESOURCE_GROUP> <LOCATION> <APP_INSIGHTS_NAME> <FUNCTION_APP_NAME>
# Example:
#   ./azure-functions/scripts/setup_appinsights.sh nexus-rg eastus nexus-ai my-nexus-func

if [ "$#" -ne 4 ]; then
  echo "Usage: $0 <RESOURCE_GROUP> <LOCATION> <APP_INSIGHTS_NAME> <FUNCTION_APP_NAME>"
  exit 2
fi

RG="$1"
LOCATION="$2"
AI_NAME="$3"
APPNAME="$4"

echo "Ensure you're logged into Azure: az login"

echo "Creating Application Insights: $AI_NAME in $LOCATION (idempotent)"
az monitor app-insights component create --app "$AI_NAME" -g "$RG" -l "$LOCATION" --application-type web

CONN_STR=$(az monitor app-insights component show --app "$AI_NAME" -g "$RG" --query connectionString -o tsv)

echo "Setting APPLICATIONINSIGHTS_CONNECTION_STRING on Function App: $APPNAME"
az functionapp config appsettings set --name "$APPNAME" --resource-group "$RG" --settings APPLICATIONINSIGHTS_CONNECTION_STRING="$CONN_STR"

echo "Restarting Function App"
az functionapp restart --name "$APPNAME" --resource-group "$RG"

echo "Done. App Insights $AI_NAME configured for $APPNAME"
