# OrderFlow

API educativa para gestionar pedidos durante el curso **GitHub Copilot Fundamentals**.

La aplicación está construida íntegramente con .NET 8 y C#. Su arquitectura separa Domain → Application → Infrastructure → API.

## Requisitos

- .NET SDK 8.0 o superior
- Git
- VS Code
- Extensión GitHub Copilot

## Ejecución

```bash
dotnet run --project src-dotnet/OrderFlow.Api
```

La URL de la API se muestra en la salida de la aplicación al iniciarse.

Para compilar y ejecutar las pruebas:

```bash
dotnet build src-dotnet/OrderFlow.sln
dotnet test src-dotnet/OrderFlow.sln
```

## Frontend

El frontend principal vive en [`src-frontend/`](src-frontend/README.md) y consume exclusivamente los endpoints existentes del backend para consultar y registrar pedidos.

### Paleta de colores

Los tokens de color están centralizados en `src-frontend/src/index.css` bajo `:root`. Todos los componentes de la pantalla principal usan exclusivamente estos tokens; no hay colores hexadecimales sueltos en los componentes.

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#2563EB` | Botones primarios, acentos de marca |
| `--color-primary-hover` | `#1D4ED8` | Estado hover de botones primarios |
| `--color-primary-contrast` | `#FFFFFF` | Texto sobre fondo primario |
| `--color-secondary` | `#0F172A` | Textos fuertes |
| `--color-background` | `#F8FAFC` | Fondo general de la aplicación |
| `--color-surface` | `#FFFFFF` | Fondo de tarjetas, formularios e inputs |
| `--color-border` | `#E2E8F0` | Bordes de inputs, tarjetas y divisores |
| `--color-text` | `#0F172A` | Texto principal |
| `--color-muted` | `#475569` | Texto secundario y placeholders |
| `--color-success` | `#16A34A` | Estado éxito |
| `--color-success-text` | `#166534` | Texto de éxito sobre fondo claro (AA ≥ 4.5:1) |
| `--color-success-bg` | `rgba(22,163,74,0.12)` | Fondo de badges y mensajes de éxito |
| `--color-warning` | `#D97706` | Estado advertencia |
| `--color-warning-text` | `#92400E` | Texto de advertencia sobre fondo claro (AA ≥ 4.5:1) |
| `--color-warning-bg` | `rgba(217,119,6,0.18)` | Fondo de badge prioridad alta |
| `--color-danger` | `#DC2626` | Estado error/cancelado |
| `--color-danger-text` | `#991B1B` | Texto de error sobre fondo claro (AA ≥ 4.5:1) |
| `--color-danger-bg` | `rgba(220,38,38,0.12)` | Fondo de badges y mensajes de error |
| `--color-info` | `#0284C7` | Estado informativo |
| `--color-info-text` | `#1D4ED8` | Texto informativo sobre fondo claro (AA ≥ 4.5:1) |
| `--color-info-bg` | `rgba(37,99,235,0.12)` | Fondo de badge prioridad baja |

Todos los pares texto/fondo cumplen contraste WCAG AA (≥ 4.5:1 para texto normal).

Para levantar ambos proyectos en local:

1. Inicia el backend:

   ```bash
   dotnet run --project src-dotnet/OrderFlow.Api
   ```

2. En otra terminal, instala y ejecuta el frontend:

   ```bash
   cd src-frontend
   npm install
   npm run dev
   ```

3. Consulta la guía completa en [`src-frontend/README.md`](src-frontend/README.md), incluyendo endpoints detectados, variable `VITE_API_BASE_URL`, pruebas y compilación.

## API

### Comprobar el estado de la API

```http
GET /health
```

Respuesta:

```json
{ "status": "ok" }
```

### Listar pedidos

```http
GET /orders
```

Devuelve todos los pedidos almacenados en memoria.

Para filtrar por prioridad:

```http
GET /orders?priority=high
```

El filtro admite `low` y `high` sin distinguir mayúsculas y minúsculas. Cualquier otro valor devuelve `400 Bad Request`.

### Crear un pedido

```http
POST /orders
Content-Type: application/json
```

Ejemplo de solicitud:

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

Campos:

- `customerId`: identificador obligatorio del cliente.
- `amount`: importe obligatorio mayor que cero.
- `isVip`: indica si el cliente es VIP. Por defecto es `false`.
- `requestedAt`: fecha de solicitud. Por defecto se utiliza la fecha actual.
- `timeZone`: zona horaria. Por defecto es `UTC`.
- `priority`: prioridad `low` o `high`. Por defecto es `low`.

La prioridad no distingue mayúsculas y minúsculas en la entrada y siempre se devuelve normalizada como `low` o `high`. Los demás valores devuelven `400 Bad Request`.

El pedido creado incluye `id`, `customerId`, `amount`, `isVip`, `requestedAt`, `timeZone`, `priority`, `status` y `createdAt`.

### Actualizar la prioridad

```http
PATCH /orders/:id/priority
Content-Type: application/json
```

Ejemplo de solicitud:

```json
{ "priority": "high" }
```

Si se omite `priority`, la orden conserva su valor actual. Un valor vacío o distinto de `low` y `high` devuelve `400 Bad Request`.

### Cancelar un pedido

```http
POST /orders/:id/cancel
```

Un pedido cancelado cambia su estado a `cancelled`. Un pedido no puede cancelarse dos veces.

## Persistencia

Los pedidos se almacenan mediante `InMemoryOrderRepository`, utilizando un diccionario en memoria. Los datos se pierden cuando se detiene o reinicia la aplicación.

## Arquitectura

El sistema usa .NET 8, C# con tipos anulables habilitados y ASP.NET Core Minimal APIs.

```text
src-dotnet/
├── OrderFlow.Domain/
├── OrderFlow.Application/
├── OrderFlow.Infrastructure/
├── OrderFlow.Api/
└── OrderFlow.Tests/

docs/
└── backlog.md
```

| Capa | Responsabilidad |
|------|-----------------|
| **Domain** | Entidad `Order`, validaciones y reglas del dominio |
| **Application** | Casos de uso y contrato del repositorio |
| **Infrastructure** | Almacenamiento de pedidos en memoria |
| **API** | Rutas HTTP y respuestas JSON |
| **Tests** | Pruebas automatizadas del dominio, servicio, repositorio y API |
| **Docs** | Requerimientos y trabajo pendiente |

## Estado actual

Implementado:

- Creación y listado de pedidos.
- Validación de cliente e importe.
- Valores predeterminados para pedidos.
- Cancelación de pedidos y prevención de cancelaciones duplicadas.
- Pruebas unitarias del dominio, servicio y repositorio.
- Pruebas de integración HTTP.

Pendiente:

- Definir si la prioridad debe calcularse automáticamente.
- Definir las posibles reglas de cliente VIP, valor del pedido y hora de corte.
- Añadir persistencia permanente.

Consulta [docs/backlog.md](docs/backlog.md) para conocer la historia prioritaria y las preguntas pendientes.

## Regla del curso

Antes de aceptar cambios generados por IA: revisar el diff, ejecutar pruebas y validar el comportamiento. Durante el curso no se autoriza al agente a realizar `commit` o `push` automáticamente.
