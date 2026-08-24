// OrderFlow – Infra mínima Dev/Staging
// Recursos: Log Analytics + Application Insights + App Service Plan (Linux) +
// App Service (.NET 8) para la API + Static Web App para el frontend.
// Sin secretos hardcodeados. Managed Identity habilitada en la API.

targetScope = 'resourceGroup'

@description('Nombre corto del proyecto. Se usa como prefijo de nombres.')
@minLength(3)
@maxLength(12)
param projectName string = 'orderflow'

@description('Entorno lógico (dev | staging | prod).')
@allowed([ 'dev', 'staging', 'prod' ])
param environmentName string = 'dev'

@description('Región de despliegue.')
param location string = resourceGroup().location

@description('Región de la Static Web App (subset limitado).')
@allowed([ 'eastus2', 'centralus', 'westus2', 'westeurope', 'eastasia' ])
param staticWebAppLocation string = 'eastus2'

@description('SKU del App Service Plan.')
@allowed([ 'B1', 'S1', 'P1v3' ])
param appServicePlanSku string = 'B1'

@description('Tags obligatorios por Azure Policy.')
param tags object = {
  project: projectName
  environment: environmentName
  managedBy: 'bicep'
  costCenter: 'orderflow'
}

var suffix = uniqueString(resourceGroup().id, environmentName)
var logAnalyticsName = '${projectName}-${environmentName}-log-${suffix}'
var appInsightsName = '${projectName}-${environmentName}-ai-${suffix}'
var planName = '${projectName}-${environmentName}-plan-${suffix}'
var apiName = '${projectName}-api-${environmentName}-${suffix}'
var swaName = '${projectName}-web-${environmentName}-${suffix}'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
  }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  tags: tags
  sku: { name: appServicePlanSku }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: apiName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      alwaysOn: appServicePlanSku != 'B1' ? true : false
      healthCheckPath: '/health'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: environmentName == 'prod' ? 'Production' : 'Staging' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'ApplicationInsightsAgent_EXTENSION_VERSION', value: '~3' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
      ]
    }
  }
}

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: swaName
  location: staticWebAppLocation
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // El despliegue del contenido se hace desde el workflow (deployment token).
    // Repo/branch se dejan vacíos: modo "Bring your own CI/CD".
    provider: 'Custom'
  }
}

output apiName string = api.name
output apiDefaultHostname string = api.properties.defaultHostName
output apiPrincipalId string = api.identity.principalId
output staticWebAppName string = swa.name
output staticWebAppDefaultHostname string = swa.properties.defaultHostname
output appInsightsName string = appInsights.name
output logAnalyticsName string = logAnalytics.name
