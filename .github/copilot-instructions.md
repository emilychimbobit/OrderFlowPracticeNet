# OrderFlow
- El sistema actual usa Node.js 20+ y CommonJS.
- El destino es .NET 8 con C# y nullable habilitado.
- Conserva Domain → Application → Infrastructure → API.
- Migra de forma incremental; no elimines Node.js.
- Mantén contratos HTTP y reglas funcionales.
- Antes de editar, presenta archivos, riesgos y pruebas.
- Valida con npm test, dotnet build y dotnet test.
