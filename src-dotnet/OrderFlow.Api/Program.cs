using System.Text.Json;
using OrderFlow.Application;
using OrderFlow.Domain;
using OrderFlow.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IOrderRepository, InMemoryOrderRepository>();
builder.Services.AddSingleton<OrderService>();

var app = builder.Build();

app.Use(async (context, next) =>
{
	try
	{
		await next(context);
	}
	catch (Exception error) when (error is ArgumentException
		or InvalidOperationException
		or BadHttpRequestException
		or JsonException)
	{
		context.Response.StatusCode = StatusCodes.Status400BadRequest;
		await context.Response.WriteAsJsonAsync(new { error = error.Message });
	}
});

app.MapGet("/health", () => Results.Json(new { status = "ok" }));
app.MapGet("/orders", (string? priority, OrderService service) =>
	Results.Json(service.List(priority)));
app.MapPost("/orders", (CreateOrderInput input, OrderService service) =>
	Results.Json(service.Create(input), statusCode: StatusCodes.Status201Created));
app.MapPatch("/orders/{id}/priority", (string id, UpdateOrderPriorityInput input, OrderService service) =>
	Results.Json(service.UpdatePriority(id, input.Priority)));
app.MapPost("/orders/{id}/cancel", (string id, OrderService service) =>
	Results.Json(service.Cancel(id)));
app.MapFallback(() => Results.Json(
	new { error = "route not found" },
	statusCode: StatusCodes.Status404NotFound));

app.Run();

public partial class Program;

public sealed record UpdateOrderPriorityInput(string? Priority);
