---
description: Migra OrderFlow de Node.js a .NET siguiendo un plan de migración por capas.
agent: agent
model: GPT-5.6 Sol
---
1. Analiza arquitectura, endpoints, reglas y pruebas.
2. Propón un mapa Node.js → .NET.
3. Espera aprobación del plan.
4. Crea la solución .NET en /src-dotnet.
5. Migra por capas sin eliminar Node.js.
6. Ejecuta npm test, dotnet build y dotnet test.
7. Resume cambios, riesgos y pendientes.
