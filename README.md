# OrderFlow

API educativa para gestionar pedidos durante el curso **GitHub Copilot Fundamentals**.

La aplicación está construida con Node.js y utiliza una arquitectura modular que separa el dominio, los servicios, el repositorio y el servidor HTTP.

## Requisitos

- Node.js 20 o superior
- Git
- VS Code
- Extensión GitHub Copilot

## Instalación

Instala las dependencias del proyecto:

```bash
npm install
```

Actualmente no hay dependencias externas de producción.

## Ejecución

```bash
npm start
```

La API queda disponible en `http://localhost:3000`.

Para ejecutar las pruebas:

```bash
npm test
```

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
  "timeZone": "America/Guayaquil"
}
```

Campos:

- `customerId`: identificador obligatorio del cliente.
- `amount`: importe obligatorio mayor que cero.
- `isVip`: indica si el cliente es VIP. Por defecto es `false`.
- `requestedAt`: fecha de solicitud. Por defecto se utiliza la fecha actual.
- `timeZone`: zona horaria. Por defecto es `UTC`.

El pedido creado incluye `id`, `customerId`, `amount`, `isVip`, `requestedAt`, `timeZone`, `priority`, `status` y `createdAt`. La prioridad inicial es siempre `normal`.

### Cancelar un pedido

```http
POST /orders/:id/cancel
```

Un pedido cancelado cambia su estado a `cancelled`. Un pedido no puede cancelarse dos veces.

## Persistencia

Los pedidos se almacenan mediante `InMemoryOrderRepository`, utilizando un `Map` en memoria. Los datos se pierden cuando se detiene o reinicia el proceso de Node.js.

## Arquitectura

La aplicación usa ES Modules y el servidor HTTP nativo de Node.js (`node:http`); no utiliza Express.

```text
src/
├── domain/
│   └── order.js
├── services/
│   └── orderService.js
├── repositories/
│   └── inMemoryOrderRepository.js
└── http/
    └── server.js

test/
└── order.test.js

docs/
└── backlog.md
```

| Capa | Responsabilidad |
|------|-----------------|
| **Domain** | Entidad `Order`, validaciones y reglas del dominio |
| **Services** | Casos de uso para crear, listar y cancelar pedidos |
| **Repositories** | Almacenamiento de pedidos en memoria |
| **HTTP** | Servidor HTTP, rutas y respuestas JSON |
| **Test** | Pruebas automatizadas del dominio y los casos de uso |
| **Docs** | Requerimientos y trabajo pendiente |

## Estado actual

Implementado:

- Creación y listado de pedidos.
- Validación de cliente e importe.
- Valores predeterminados para pedidos.
- Cancelación de pedidos y prevención de cancelaciones duplicadas.
- Pruebas unitarias del dominio, servicio y repositorio.

Pendiente:

- Implementar el cálculo real de prioridad.
- Definir las reglas de cliente VIP, valor del pedido y hora de corte.
- Añadir persistencia permanente.
- Añadir pruebas de integración HTTP.

Consulta [docs/backlog.md](docs/backlog.md) para conocer la historia prioritaria y las preguntas pendientes.

## Regla del curso

Antes de aceptar cambios generados por IA: revisar el diff, ejecutar pruebas y validar el comportamiento. Durante el curso no se autoriza al agente a realizar `commit` o `push` automáticamente.
