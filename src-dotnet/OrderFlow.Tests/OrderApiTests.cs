using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace OrderFlow.Tests;

public sealed class OrderApiTests
{
    [Fact]
    public async Task Health_ReturnsOk()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();

        var response = await client.GetAsync("/health");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("ok", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Orders_CreateListAndCancel()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/orders", new
        {
            customerId = " C-100 ",
            amount = 250,
            isVip = false,
            requestedAt = "2026-08-14T15:00:00.000Z",
            timeZone = "America/Guayaquil"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetString();

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.Equal("C-100", created.GetProperty("customerId").GetString());
        Assert.Equal("normal", created.GetProperty("priority").GetString());
        Assert.Equal("created", created.GetProperty("status").GetString());

        var orders = await client.GetFromJsonAsync<JsonElement>("/orders");
        Assert.Single(orders.EnumerateArray());

        var cancelResponse = await client.PostAsync($"/orders/{id}/cancel", null);
        var cancelled = await cancelResponse.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);
        Assert.Equal("cancelled", cancelled.GetProperty("status").GetString());
    }

    [Fact]
    public async Task InvalidOrder_ReturnsCurrentDomainError()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();

        var response = await client.PostAsJsonAsync("/orders", new { amount = 10 });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("customerId is required", body.GetProperty("error").GetString());
    }

    [Fact]
    public async Task UnknownRoute_ReturnsCurrentNotFoundResponse()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();

        var response = await client.GetAsync("/unknown");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("route not found", body.GetProperty("error").GetString());
    }
}