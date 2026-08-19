# Backlog del curso

OrderFlow se mantiene íntegramente en .NET 8 con C# y conserva la arquitectura Domain → Application → Infrastructure → API.

## Historia prioritaria (deliberadamente ambigua)

Como operador logístico, quiero que OrderFlow calcule la prioridad de cada pedido considerando si el cliente es VIP, el valor del pedido y la cercanía a la hora de corte, para atender primero los pedidos más importantes.

La prioridad debe ser `low` o `high`. Mientras no exista un cálculo automático, usar `low` cuando no se proporcione una prioridad.

## Preguntas pendientes

- ¿Qué valor convierte un pedido en alto valor?
- ¿Cuál es la hora de corte y en qué zona horaria se interpreta?
- ¿Cuántos minutos antes del corte se considera “cercano”?
- ¿Ser VIP basta para obtener prioridad alta?
- ¿Cómo se combinan reglas que producen prioridades diferentes?

Estas preguntas son parte de la práctica: no deben resolverse por intuición ni implementarse todavía.
