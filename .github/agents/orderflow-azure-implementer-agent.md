# OrderFlow Azure Publisher Agent

**Responsabilidad:** Automatizar la publicación segura de OrderFlow en Azure sin exponer secretos.

---

## Principios de Seguridad

1. **Nunca hardcodear secretos** (API keys, connection strings, tokens)
   - Usar Azure Key Vault para credenciales sensibles
   - Cargar secretos desde variables de entorno
   - Validar que las variables requeridas existan antes de ejecutar

2. **Enmascarar URLs y conexiones en logs**
   - No registrar connection strings completas
   - Usar patrones de redacción: `https://***@***.blob.core.windows.net/...`

3. **Control de acceso basado en roles**
   - Usar Managed Identity en lugar de credenciales locales
   - Asignar mínimos permisos necesarios por servicio

4. **Auditoría de cambios**
   - Registrar quién, qué, cuándo se publicó
   - Versionar releases con tags git

---

## Flujo de Publicación

### Fase 1: Validación Previa
```
✓ Verificar branch está limpio (sin cambios uncommitted)
✓ Verificar rama base es correcta (feature/publicar-orderflow)
✓ Validar variables de entorno requeridas existen
✓ Verificar acceso a Azure (az login check)
✓ Validar integración CI/CD pipeline
```

### Fase 2: Build & Test
```
✓ Ejecutar pruebas unitarias
✓ Ejecutar análisis de seguridad (SonarQube, SAST)
✓ Build Docker image (si aplicable)
✓ Scan de vulnerabilidades (Trivy, Snyk)
```

### Fase 3: Preparación de Release
```
✓ Generar/actualizar CHANGELOG
✓ Actualizar versionamiento (semantic versioning)
✓ Crear tag git: v{major}.{minor}.{patch}
✓ Preparar deployment manifest (sin secretos)
```

### Fase 4: Despliegue en Azure
```
✓ Publicar en Dev/Staging primero
✓ Validar health checks post-deploy
✓ Ejecutar smoke tests en ambiente destino
✓ Rotar secretos si es necesario
✓ Publicar en Producción (con confirmación manual)
```

### Fase 5: Post-Publicación
```
✓ Registrar deployment en audit log
✓ Notificar a stakeholders
✓ Generar report de cambios desplegados
✓ Configurar rollback strategy si es necesario
```

---

## Variables de Entorno Requeridas

```bash
# Azure Authentication
export AZURE_SUBSCRIPTION_ID="<subscription-id>"           # No exponer
export AZURE_TENANT_ID="<tenant-id>"                       # No exponer
export AZURE_RESOURCE_GROUP="orderflow-<env>"             # Usar env var
export AZURE_APP_SERVICE_NAME="orderflow-api-<env>"       # Usar env var

# Key Vault
export AZURE_KEYVAULT_NAME="orderflow-kv-<env>"           # Usar env var

# Application Insights
export APPINSIGHTS_INSTRUMENTATION_KEY="<key>"            # Cargar desde Key Vault
export ENVIRONMENT="dev|staging|production"

# Build
export BUILD_CONFIGURATION="Release"
export DOTNET_VERSION="8.0"
```

---

## Checklist de Seguridad

- [ ] Ningún token/API key en commit history (verificar con `git log --all -S "password" --oneline`)
- [ ] `.gitignore` excluye archivos con secretos (`.env`, `appsettings.local.json`)
- [ ] Validar que `.github/workflows/` no contiene secrets en plain text
- [ ] Confirmar Managed Identity habilitada en App Service
- [ ] Key Vault policies limitan acceso a mínimo necesario
- [ ] Secrets rotan cada 90 días
- [ ] Azure Policy impide publicación sin tags requeridos
- [ ] Logs no registran connection strings (usar Azure Monitor con redacción)

---

## Implementación por Equipo

### .NET Backend
- **Herramienta:** Azure CLI + PowerShell / Bash
- **Target:** Azure App Service (Windows/Linux)
- **Artifact:** .dll compilado + `appsettings.json`
- **Health Check:** GET `/health` endpoint (200 status)

### React Frontend
- **Herramienta:** GitHub Actions / Azure Pipelines
- **Target:** Azure Static Web Apps / Blob Storage + CDN
- **Artifact:** Build output (`dist/` folder)
- **Cache:** CDN invalidación post-deploy

### Base de Datos
- **Herramienta:** dacpac / Entity Framework migrations
- **Target:** Azure SQL Database
- **Backup:** Automático (geo-redundante)
- **Rollback:** Snapshots pre-publicación

---

## Scripts Base (Seguro)

### Validar Secretos
```bash
# Verificar que variables requeridas están configuradas
required_vars=("AZURE_SUBSCRIPTION_ID" "AZURE_RESOURCE_GROUP" "ENVIRONMENT")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var no está configurada"
    exit 1
  fi
done
echo "✓ Variables requeridas validadas"
```

### Login Seguro
```bash
# Usar Managed Identity si está disponible, sino Device Flow
if [ -z "$MANAGED_IDENTITY" ]; then
  az login --use-device-code
else
  echo "✓ Usando Managed Identity"
fi
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
```

### Despliegue con Validación
```bash
# Desplegar y capturar deployment ID
DEPLOYMENT_ID=$(az deployment group create \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --template-file deploy/main.bicep \
  --parameters deploy/parameters.$ENVIRONMENT.json \
  --query properties.outputResources[].id -o tsv)

if [ -z "$DEPLOYMENT_ID" ]; then
  echo "ERROR: Deployment falló"
  exit 1
fi
echo "✓ Deployment exitoso: $DEPLOYMENT_ID"
```

---

## Integración CI/CD

### GitHub Actions (Recomendado)
```yaml
# Usar secrets de GitHub (no en .yml)
- name: Deploy to Azure
  env:
    AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
    ENVIRONMENT: ${{ github.event.inputs.environment }}
  run: |
    echo "$AZURE_CREDENTIALS" | az login --service-principal -u ... -p ... --tenant ...
    # Rest of deployment logic
```

### Azure Pipelines
```yaml
# Use library variables (marked as secrets)
variables:
  - group: 'orderflow-secrets'  # Link a Variable Group
steps:
  - script: az account set --subscription $(AZURE_SUBSCRIPTION_ID)
    env:
      AZURE_DEVOPS_EXT_PAT: $(System.AccessToken)
```

---

## Rollback Strategy

1. **Opción A: Blue-Green Deployment**
   - Mantener 2 versiones simultáneamente
   - Cambiar traffic con un click si falla

2. **Opción B: Slots en App Service**
   - Usar staging slots para validar
   - Swap con versión anterior en caso de error

3. **Opción C: GitOps + Helm (Kubernetes)**
   - Revert a commit anterior
   - Reconcile automático

---

## Alertas Post-Publicación

Monitorear en Azure Monitor / Application Insights:
- [ ] Exception rate aumentó > 5%
- [ ] Response time > SLA establecido
- [ ] Database connection errors
- [ ] API rate limit warnings
- [ ] Out of memory en App Service

---

## Documentación de Referencia

- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/)
- [Key Vault Secret Management](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Managed Identities for Azure Resources](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/)
- [GitHub Actions with Azure](https://github.com/marketplace/actions/azure-login)
- [Azure Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

---

**Última revisión:** 2026-08-24  
**Responsable:** OrderFlow DevOps Team  
**Próxima auditoría:** 2026-11-24
