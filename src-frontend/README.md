# Frontend de OrderFlow

Aplicación React + TypeScript para consultar y registrar pedidos consumiendo el backend existente en `src-dotnet/`.

## Requisitos

- Node.js 22+
- npm 10+
- .NET SDK 8.0+

## Endpoints detectados del backend

Base URL de desarrollo del backend:

- `http://localhost:3000` (`src-dotnet/OrderFlow.Api/Properties/launchSettings.json`)
- Perfil HTTPS disponible en `https://localhost:7089`

Endpoints reales descubiertos en `src-dotnet/OrderFlow.Api/Program.cs`:

- `GET /orders`
  - Lista todos los pedidos.
  - Filtros opcionales existentes: `priority=low|high` o `amount=<number>`
  - `priority` y `amount` son mutuamente excluyentes.
  - Respuestas esperadas: `200`, `400`
- `POST /orders`
  - Crea un pedido.
  - Body JSON:
    ```json
    {
      "customerId": "C-100",
      "amount": 250,
      "isVip": false,
      "requestedAt": "2026-08-14T15:00:00.000Z",
      "timeZone": "America/Guayaquil",
      "priority": "high"
    }
    ```
  - Respuestas esperadas: `201`, `400`
- `PATCH /orders/{id}/priority`
  - Existe en backend, pero no se consume en esta UI.
  - Respuestas esperadas: `200`, `400`
- `POST /orders/{id}/cancel`
  - Existe en backend, pero no se consume en esta UI.
  - Respuestas esperadas: `200`, `400`
- Fallback de rutas no encontradas:
  - `404` con `{ "error": "route not found" }`

La UI de esta carpeta consume exclusivamente `GET /orders` y `POST /orders`, que son los endpoints necesarios para consultar y registrar pedidos.

## Variables de entorno

- `VITE_API_BASE_URL`
  - Opcional.
  - Si no se define, la app detecta `http://localhost:3000` como base del backend y, durante `npm run dev`, usa el proxy de Vite mediante `/api` para evitar CORS.

## Ejecutar backend y frontend en paralelo

1. Inicia el backend:

   ```bash
   dotnet run --project /home/runner/work/OrderFlowPracticeNet/OrderFlowPracticeNet/src-dotnet/OrderFlow.Api
   ```

2. En otra terminal, instala dependencias del frontend:

   ```bash
   cd /home/runner/work/OrderFlowPracticeNet/OrderFlowPracticeNet/src-frontend
   npm install
   ```

3. Arranca el frontend:

   ```bash
   npm run dev
   ```

4. Abre la URL que muestre Vite en la terminal.

## Scripts disponibles

- `npm run dev`: inicia el frontend con proxy local al backend.
- `npm run build`: compila TypeScript y genera `dist/`.
- `npm run test`: ejecuta la suite de Vitest.

## Validaciones del formulario

- `customerId` es obligatorio y se recorta antes de enviar.
- `amount` es obligatorio y debe ser numérico, finito y mayor que `0`.
- `customerId` admite hasta `50` caracteres.
- `timeZone` admite hasta `100` caracteres.
- `requestedAt` es opcional; si se informa, se envía en formato ISO UTC.
- `priority` solo permite `low` o `high`.

## Estados de la UI

- **Cargando:** skeleton accesible con `aria-live`.
- **Vacío:** mensaje con CTA para registrar el primer pedido.
- **Error:** mensaje claro con botón para reintentar.
- **Éxito al crear:** mensaje de confirmación y recarga automática del listado.
