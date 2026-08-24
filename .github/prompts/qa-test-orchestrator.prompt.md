---
name: QA Test Orchestrator
description: Ejecuta build, tests frontend, E2E con Playwright y genera reporte HTML consolidado
model: Claude Opus 4.7 (copilot)
---

# Flujo de Orquestación de QA

## Objetivo

Automatizar la ejecución de tests (Frontend + E2E), capturar evidencia visual y generar un reporte HTML consolidado en `qa-report/report.html`.

---

## Prerequisitos

### 1. Verificar Entorno

- [ ] Backend API debe estar ejecutándose (validar con `curl http://localhost:3000/health` o similar)
- [ ] Frontend debe poder compilarse sin dependencias faltantes
- [ ] MCP Playwright configurado en `.vscode/mcp.json`

Ejecuta:
```bash
# Verificar que el backend está disponible
curl -I http://localhost:3000/health

# Navegación a src-frontend
cd src-frontend

# Verificar dependencias
npm --version  # Debe estar disponible
node --version # Debe estar disponible
```

Si falla algún prerequisito, reporta y detente.

---

## Fase 1: Build Frontend

**Objetivo**: Compilar TypeScript sin errores.

Ejecuta en `src-frontend/`:
```bash
npm run build
```

**Validación**:
- Exit code debe ser 0
- Debe generarse `dist/` sin warnings críticos
- Si falla: captura error y reporta con `BUILD FAILED`

**Salida esperada**:
- `dist/index.html`, `dist/assets/`, etc.
- Timestamp de compilación

---

## Fase 2: Ejecutar Tests Frontend (Vitest)

**Objetivo**: Ejecutar Vitest y capturar resultados en JSON.

Ejecuta en `src-frontend/`:
```bash
npm run test -- --reporter=json > test-results.json 2>&1
```

**Validación**:
- Captura todos los tests que corran (expected: ~4-6 tests entre componentes y API client)
- Parsea `test-results.json` para extraer:
  - `numPassedTests`
  - `numFailedTests`
  - `numPendingTests`
  - `testResults[].name` (archivo)
  - `testResults[].assertionResults[]` → `title`, `status`, `duration`, `failureMessages`

**Mapeo a reporte**:
```json
{
  "frontend": {
    "total": <sum of all assertions>,
    "passed": <numPassedTests>,
    "failed": <numFailedTests>,
    "skipped": <numPendingTests>,
    "duration": <testResults.reduce((sum, t) => sum + t.perfStats.end - t.perfStats.start, 0)>,
    "tests": [
      {
        "file": "components/NewOrderForm.test.tsx",
        "name": "NewOrderForm › should not submit with invalid customer ID",
        "status": "passed",
        "duration": 45,
        "error": null
      },
      ...
    ]
  }
}
```

---

## Fase 3: Ejecutar Tests E2E con MCP Playwright

**Objetivo**: Navegar a la app, capturar screenshots y validar funcionalidad.

### 3a. Iniciar Backend (si no está corriendo)

```bash
cd src-dotnet
dotnet run --project OrderFlow.Api/OrderFlow.Api.csproj &
# Esperar 3 segundos para que inicie
sleep 3
```

### 3b. Usar MCP Playwright para Tests E2E

Usa MCP Playwright (`@playwright/mcp@latest`) para:

1. **Test: Landing Page**
   - Navega a `http://localhost:3000`
   - Verifica que la página carga (title, h1, formulario de crear orden visible)
   - Captura screenshot: `qa-report/screenshots/landing-page.png`
   - Status: PASS/FAIL

2. **Test: Swagger UI**
   - Navega a `http://localhost:3000/swagger/index.html`
   - Verifica que contiene "Swagger" en title
   - Captura screenshot: `qa-report/screenshots/swagger-ui.png`
   - Status: PASS/FAIL

3. **Test: Health Check (API)**
   - `GET http://localhost:3000/health`
   - Valida response status 200
   - Status: PASS/FAIL

4. **Test: Fetch Orders (API)**
   - `GET http://localhost:3000/api/orders` (o endpoint configurado)
   - Valida response 200 y estructura JSON
   - Status: PASS/FAIL

5. **Test: Create Order (API)**
   - `POST http://localhost:3000/api/orders` con payload válido
   - Valida response 201 y ID generado
   - Status: PASS/FAIL

**Mapeo a reporte**:
```json
{
  "e2e": {
    "total": 5,
    "passed": 4,
    "failed": 1,
    "skipped": 0,
    "duration": 8500,
    "tests": [
      {
        "name": "Landing Page",
        "status": "passed",
        "duration": 2100,
        "screenshot": "screenshots/landing-page.png"
      },
      {
        "name": "Swagger UI",
        "status": "passed",
        "duration": 1800,
        "screenshot": "screenshots/swagger-ui.png"
      },
      {
        "name": "Health Check",
        "status": "passed",
        "duration": 450
      },
      {
        "name": "Fetch Orders",
        "status": "passed",
        "duration": 550
      },
      {
        "name": "Create Order",
        "status": "failed",
        "duration": 600,
        "error": "Expected status 201, got 400"
      }
    ]
  }
}
```

---

## Fase 4: Compilar Reporte HTML

**Objetivo**: Crear `qa-report/report.html` consolidado.

### 4a. Crear Estructura de Directorios

```bash
mkdir -p qa-report/screenshots
```

### 4b. Generar HTML Consolidado

Combina resultados de Fase 2 y Fase 3 en un archivo HTML autosuficiente.

**Estructura del reporte**:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OrderFlow QA Report</title>
  <style>
    /* CSS Inline - Ver abajo */
  </style>
</head>
<body>
  <header>
    <h1>📊 OrderFlow QA Report</h1>
    <p class="timestamp">Generated: <strong>2026-08-24 14:32:15 UTC</strong></p>
  </header>

  <!-- Resumen Ejecutivo -->
  <section id="executive-summary">
    <h2>📈 Resumen Ejecutivo</h2>
    <div class="summary-grid">
      <div class="metric">
        <strong>Total Tests</strong>
        <span class="value">9</span>
      </div>
      <div class="metric passed">
        <strong>✅ Passed</strong>
        <span class="value">8</span>
      </div>
      <div class="metric failed">
        <strong>❌ Failed</strong>
        <span class="value">1</span>
      </div>
      <div class="metric skipped">
        <strong>⏭️ Skipped</strong>
        <span class="value">0</span>
      </div>
      <div class="metric">
        <strong>Duración Total</strong>
        <span class="value">10.25s</span>
      </div>
      <div class="metric">
        <strong>Resultado</strong>
        <span class="badge failed">BLOQUEADO</span>
      </div>
    </div>
  </section>

  <!-- Tests Frontend -->
  <section id="frontend-tests">
    <h2>🎨 Frontend Tests (Vitest)</h2>
    <table>
      <thead>
        <tr>
          <th>Archivo</th>
          <th>Test</th>
          <th>Status</th>
          <th>Duración (ms)</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        <tr class="passed">
          <td>NewOrderForm.test.tsx</td>
          <td>should not submit with invalid customer ID</td>
          <td>✅ PASSED</td>
          <td>45</td>
          <td>-</td>
        </tr>
        <!-- Más filas según resultados -->
      </tbody>
    </table>
  </section>

  <!-- Tests E2E -->
  <section id="e2e-tests">
    <h2>🌐 E2E Tests (Playwright)</h2>
    <table>
      <thead>
        <tr>
          <th>Test</th>
          <th>Status</th>
          <th>Duración (ms)</th>
          <th>Screenshot</th>
          <th>Detalles</th>
        </tr>
      </thead>
      <tbody>
        <tr class="passed">
          <td>Landing Page</td>
          <td>✅ PASSED</td>
          <td>2100</td>
          <td><a href="screenshots/landing-page.png" target="_blank">📷 Ver</a></td>
          <td>-</td>
        </tr>
        <tr class="passed">
          <td>Swagger UI</td>
          <td>✅ PASSED</td>
          <td>1800</td>
          <td><a href="screenshots/swagger-ui.png" target="_blank">📷 Ver</a></td>
          <td>-</td>
        </tr>
        <tr class="failed">
          <td>Create Order</td>
          <td>❌ FAILED</td>
          <td>600</td>
          <td>-</td>
          <td>Expected status 201, got 400</td>
        </tr>
        <!-- Más filas según resultados -->
      </tbody>
    </table>
  </section>

  <!-- Galería de Screenshots -->
  <section id="screenshots-gallery">
    <h2>📸 Screenshots</h2>
    <div class="gallery">
      <figure>
        <img src="screenshots/landing-page.png" alt="Landing Page" loading="lazy">
        <figcaption>Landing Page - http://localhost:3000</figcaption>
      </figure>
      <figure>
        <img src="screenshots/swagger-ui.png" alt="Swagger UI" loading="lazy">
        <figcaption>Swagger UI - /swagger/index.html</figcaption>
      </figure>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <p>Reporte generado automáticamente por OrderFlow QA Agent</p>
    <p><small>Raw data: <a href="test-results.json">test-results.json</a></small></p>
  </footer>
</body>
</html>
```

### 4c. CSS Inline (completo)

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

header {
  background: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

header h1 {
  font-size: 2em;
  margin-bottom: 10px;
  color: #667eea;
}

.timestamp {
  color: #666;
  font-size: 0.95em;
}

section {
  background: white;
  padding: 25px;
  margin-bottom: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

section h2 {
  font-size: 1.5em;
  margin-bottom: 20px;
  color: #667eea;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.metric {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  border-left: 4px solid #667eea;
}

.metric.passed {
  border-left-color: #28a745;
}

.metric.failed {
  border-left-color: #dc3545;
}

.metric.skipped {
  border-left-color: #ffc107;
}

.metric strong {
  display: block;
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.metric .value {
  display: block;
  font-size: 1.8em;
  font-weight: bold;
  color: #667eea;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: bold;
  color: white;
}

.badge.passed {
  background-color: #28a745;
}

.badge.failed {
  background-color: #dc3545;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

table thead {
  background: #f5f5f5;
}

table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  color: #333;
}

table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

table tr.passed {
  background: #f0f9f0;
}

table tr.failed {
  background: #fff0f0;
}

table tr.skipped {
  background: #fffaf0;
}

table a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

table a:hover {
  text-decoration: underline;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

figure {
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  background: #f9f9f9;
}

figure img {
  width: 100%;
  height: auto;
  display: block;
}

figcaption {
  padding: 12px;
  text-align: center;
  font-size: 0.9em;
  color: #666;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
}

footer {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  color: #666;
  font-size: 0.9em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

footer a {
  color: #667eea;
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}
```

### 4d. Guardar JSON de Resultados

Genera `qa-report/test-results.json` con estructura consolidada:

```json
{
  "timestamp": "2026-08-24T14:32:15Z",
  "build": {
    "status": "success",
    "duration": 3500,
    "command": "npm run build"
  },
  "frontend": {
    "total": 4,
    "passed": 4,
    "failed": 0,
    "skipped": 0,
    "duration": 1250,
    "tests": [...]
  },
  "e2e": {
    "total": 5,
    "passed": 4,
    "failed": 1,
    "skipped": 0,
    "duration": 8500,
    "tests": [...]
  },
  "summary": {
    "totalTests": 9,
    "totalPassed": 8,
    "totalFailed": 1,
    "totalSkipped": 0,
    "totalDuration": 10250,
    "status": "BLOCKED"
  }
}
```

---

## Fase 5: Validación y Reporte Final

**Validar entregables**:
- [ ] `qa-report/report.html` existe y es válido (no vacío, contiene HTML bien formado)
- [ ] `qa-report/test-results.json` existe con datos estructurados
- [ ] `qa-report/screenshots/` contiene imágenes (.png)
- [ ] Reporte HTML abre sin errores en navegador

**Reporte final**:
```
✅ QA Execution Complete

📊 Resumen:
  - Total Tests: 9
  - ✅ Passed: 8 (88.9%)
  - ❌ Failed: 1 (11.1%)
  - ⏭️ Skipped: 0
  - ⏱️ Duración: 10.25s

📁 Entregables:
  - Reporte HTML: qa-report/report.html
  - Datos JSON: qa-report/test-results.json
  - Screenshots: qa-report/screenshots/
    • landing-page.png
    • swagger-ui.png

⚠️ Bloqueos:
  - Create Order API retorna 400 (investigar)

📝 Próximas Acciones:
  - Revisar reporte en: qa-report/report.html
  - Depurar fallo de Create Order
  - Ejecutar nuevamente después de fix
```

---

## Notas de Implementación

1. **Parseo JSON Vitest**: Si `npm run test` no genera JSON automáticamente, ejecuta con flag `--reporter=json`
2. **Screenshots con Playwright**: MCP Playwright debe tener permisos para escribir en `qa-report/screenshots/`
3. **CSS Inline**: Todo CSS debe estar en `<style>` dentro del HTML para portabilidad
4. **Links relativos**: Screenshots deben ser rutas relativas (`screenshots/landing-page.png`) para funcionar offline
5. **Tabla responsiva**: Las tablas usan `word-break: break-word` para mobile
6. **Sin dependencias externas**: No uses CDNs, librerías externas, o fuentes remotas
