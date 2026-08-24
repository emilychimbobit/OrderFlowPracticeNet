# OrderFlow · Despliegue en Azure (Dev)

Scaffold mínimo para publicar OrderFlow en Azure siguiendo el flujo del agente
`OrderFlow Azure Implementer`. **Sin secretos en el repo.**

## Contenido

| Archivo | Propósito |
|---|---|
| `main.bicep` | Log Analytics + App Insights + App Service Plan (Linux) + App Service (.NET 8) + Static Web App |
| `parameters.dev.json` | Parámetros del entorno `dev` (region `eastus2`) |

## Prerrequisitos

1. **Azure CLI** ≥ 2.60 y sesión activa (`az login`).
2. **Suscripción destino** seleccionada:
   ```powershell
   az account set --subscription "<AZURE_SUBSCRIPTION_ID>"
   ```
3. **Resource Group** creado (una sola vez):
   ```powershell
   az group create --name orderflow-dev --location eastus2 `
     --tags project=orderflow environment=dev managedBy=bicep costCenter=orderflow
   ```
4. **OIDC / Federated Credential** para GitHub Actions (recomendado sobre secretos):
   - Crear App Registration en Entra ID.
   - Asignar rol `Contributor` sobre el RG `orderflow-dev`.
   - Configurar Federated Credential:
     - Issuer: `https://token.actions.githubusercontent.com`
     - Subject: `repo:<owner>/<repo>:ref:refs/heads/feature/publicar-orderflow`
     - Audience: `api://AzureADTokenExchange`
   - Registrar como variables de repo (no secrets):
     `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.

## Validación (sin desplegar)

```powershell
# What-if muestra el diff contra el RG
az deployment group what-if `
  --resource-group orderflow-dev `
  --template-file deploy/main.bicep `
  --parameters deploy/parameters.dev.json
```

## Despliegue de infra

```powershell
az deployment group create `
  --resource-group orderflow-dev `
  --template-file deploy/main.bicep `
  --parameters deploy/parameters.dev.json `
  --name "orderflow-dev-$(Get-Date -Format yyyyMMddHHmm)"
```

Outputs relevantes: `apiName`, `apiDefaultHostname`, `staticWebAppName`,
`staticWebAppDefaultHostname`.

## Publicación de código

El workflow `.github/workflows/deploy.yml` realiza:

1. `dotnet publish` de `OrderFlow.Api` → zip → `az webapp deploy` (paquete zip).
2. `npm ci && npm run build` de `src-frontend` → `Azure/static-web-apps-deploy`.
3. Smoke test: `GET https://<api>/health` debe retornar `200`.

## Rollback

- **App Service:** slot `staging` (a futuro) o redeploy del zip previo.
- **Static Web App:** rollback vía commit reverse + re-run del workflow.
- **Infra:** `az deployment group create` idempotente; para eliminar recursos
  huérfanos usar `az resource delete` con confirmación explícita.

## Notas de seguridad

- `httpsOnly: true`, `minTlsVersion: 1.2`, `ftpsState: Disabled`.
- API con Managed Identity system-assigned (para consumir Key Vault / SQL a futuro).
- App Insights conectado a Log Analytics; no se registran connection strings.
- Ningún secreto en `parameters.*.json`; sólo configuración pública.
