---
name: order-priority-validation
description: Validar y normalizar el campo Priority en órdenes según reglas de negocio establecidas (low/high)
---

# Order Priority Validation Skill

## Propósito
Validar y normalizar el campo `Priority` en órdenes según las reglas de negocio establecidas. Esta skill **organiza las reglas existentes** sin inventar nuevas.

## Valores Permitidos
El campo `Priority` admite únicamente dos valores válidos:
- `low` - prioridad baja
- `high` - prioridad alta

Estos están definidos en [OrderPriorities](../../src-dotnet/OrderFlow.Domain/Order.cs) como constantes.

## Reglas de Validación

### 1. Valor por Defecto
**Ubicación**: [Order.Create()](../../src-dotnet/OrderFlow.Domain/Order.cs#L51)

Si el usuario NO proporciona un valor de `Priority`:
- El valor asignado es **`low`** (no `normal`)
- Esto ocurre automáticamente cuando `Priority` es `null`

```csharp
input.Priority is null ? OrderPriorities.Low : OrderPriorities.Normalize(input.Priority)
```

### 2. Normalización de Mayúsculas/Minúsculas
**Ubicación**: [OrderPriorities.Normalize()](../../src-dotnet/OrderFlow.Domain/Order.cs#L15)

Si el usuario envía un valor en mayúsculas o minúsculas mixtas:
- Normalizar a minúsculas
- Ejemplos:
  - `LOW` → `low` ✅
  - `High` → `high` ✅
  - `LOW` → `low` ✅

La normalización es **case-insensitive** usando `StringComparison.OrdinalIgnoreCase`.

### 3. Validación de Valores Inválidos
**Ubicación**: [OrderPriorities.Normalize()](../../src-dotnet/OrderFlow.Domain/Order.cs#L15)

Si el usuario envía un valor diferente a `low` o `high`:
- Lanzar `ArgumentException` con mensaje: `"priority must be 'low' or 'high'"`
- La respuesta HTTP será **400 Bad Request** con el error en el cuerpo
- Ejemplos inválidos:
  - `normal` ❌
  - `medium` ❌
  - `urgent` ❌
  - `""` (vacío) ❌

## Puntos de Aplicación

### Creación de Orden
**Endpoint**: `POST /orders`

```json
{
  "customerId": "CUST123",
  "amount": 100.0,
  "priority": "LOW"  // Se normaliza a "low"
}
```

**Sin Priority especificado**:
```json
{
  "customerId": "CUST123",
  "amount": 100.0
  // Priority será "low" automáticamente
}
```

### Actualización de Priority
**Endpoint**: `PATCH /orders/{id}/priority`

```json
{
  "priority": "High"  // Se normaliza a "high"
}
```

**Sin Priority (null)**:
```json
{
  "priority": null
}
```
El orden conserva su `Priority` actual sin cambios.

### Filtrado de Órdenes
**Endpoint**: `GET /orders?priority=LOW`

El filtro normaliza automáticamente, por lo que:
- `?priority=low` ✅
- `?priority=LOW` ✅
- `?priority=Low` ✅
- Todos devuelven órdenes con `priority="low"`

## Flujo de Validación (orden de ejecución)

```
1. Usuario envía valor Priority
   ↓
2. ¿Es null?
   → Sí: usar "low" [CREACIÓN]
   → No: ir a paso 3
   ↓
3. Normalizar a minúsculas
   ↓
4. ¿Es "low" o "high"?
   → Sí: usar valor normalizado ✅
   → No: lanzar ArgumentException ❌
   ↓
5. Guardar orden con Priority validado
```

## Contratos HTTP

| Escenario | Código | Respuesta |
|-----------|--------|-----------|
| Priority válido (low/high) | 200/201 | Orden guardada ✅ |
| Priority inválido | 400 | `{"error": "priority must be 'low' or 'high'"}` |
| Priority omitido (creación) | 201 | Orden con `priority: "low"` |
| Priority null (actualización) | 200 | Orden sin cambios |

## Consideraciones Importantes

- **No invertir "normal"**: El default es `"low"`, no `"normal"`
- **Inmutable en Domain**: Las reglas de validación están en `OrderPriorities` (Domain), no en API
- **Consistencia**: Todos los endpoints aplican las mismas reglas
- **No hay excepciones**: Las reglas son fijas; no se crean nuevas según entrada del usuario

## Referencias de Código

- **Domain Model**: [Order.cs](../../src-dotnet/OrderFlow.Domain/Order.cs)
- **Lógica de Aplicación**: [OrderService.cs](../../src-dotnet/OrderFlow.Application/OrderService.cs)
- **Endpoints HTTP**: [Program.cs](../../src-dotnet/OrderFlow.Api/Program.cs)
- **Tests**: [OrderTests.cs](../../src-dotnet/OrderFlow.Tests/OrderTests.cs), [OrderServiceTests.cs](../../src-dotnet/OrderFlow.Tests/OrderServiceTests.cs)
