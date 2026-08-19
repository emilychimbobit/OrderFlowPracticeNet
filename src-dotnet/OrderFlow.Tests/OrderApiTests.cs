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
            timeZone = "America/Guayaquil",
            priority = "LOW"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetString();

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.Equal("C-100", created.GetProperty("customerId").GetString());
        Assert.Equal("low", created.GetProperty("priority").GetString());
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
    public async Task CreateOrder_OmittedPriorityDefaultsToLow()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();

        var response = await client.PostAsJsonAsync("/orders", new
        {
            customerId = "C-1",
            amount = 10
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("low", body.GetProperty("priority").GetString());
    }

    [Theory]
    [InlineData("medium")]
    [InlineData("normal")]
    [InlineData("")]
    [InlineData("urgent")]
    public async Task CreateOrder_RejectsInvalidPriority(string priority)
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();

        var response = await client.PostAsJsonAsync("/orders", new
        {
            customerId = "C-1",
            amount = 10,
            priority
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("priority", body.GetProperty("error").GetString());
    }

    [Fact]
    public async Task Orders_FilterByPriorityAndRejectInvalidFilter()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();
        await client.PostAsJsonAsync("/orders", new { customerId = "C-low", amount = 10 });
        await client.PostAsJsonAsync("/orders", new
        {
            customerId = "C-high",
            amount = 20,
            priority = "High"
        });

        var lowResponse = await client.GetAsync("/orders?priority=LOW");
        var lowOrders = await lowResponse.Content.ReadFromJsonAsync<JsonElement>();
        var invalidResponse = await client.GetAsync("/orders?priority=medium");

        Assert.Equal(HttpStatusCode.OK, lowResponse.StatusCode);
        Assert.Single(lowOrders.EnumerateArray());
        Assert.Equal("low", lowOrders[0].GetProperty("priority").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);
    }

    [Fact]
    public async Task UpdatePriority_NormalizesAndPersistsPriority()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();
        var createResponse = await client.PostAsJsonAsync("/orders", new
        {
            customerId = "C-1",
            amount = 10
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetString();

        var updateResponse = await client.PatchAsJsonAsync(
            $"/orders/{id}/priority",
            new { priority = "HIGH" });
        var updated = await updateResponse.Content.ReadFromJsonAsync<JsonElement>();
        var listed = await client.GetFromJsonAsync<JsonElement>("/orders?priority=high");

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Equal("high", updated.GetProperty("priority").GetString());
        Assert.Single(listed.EnumerateArray());
    }

    [Fact]
    public async Task UpdatePriority_PreservesOmittedValueAndRejectsInvalidValue()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();
        var createResponse = await client.PostAsJsonAsync("/orders", new
        {
            customerId = "C-1",
            amount = 10,
            priority = "high"
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetString();

        var omittedResponse = await client.PatchAsJsonAsync(
            $"/orders/{id}/priority",
            new { });
        var omitted = await omittedResponse.Content.ReadFromJsonAsync<JsonElement>();
        var invalidResponse = await client.PatchAsJsonAsync(
            $"/orders/{id}/priority",
            new { priority = "medium" });

        Assert.Equal(HttpStatusCode.OK, omittedResponse.StatusCode);
        Assert.Equal("high", omitted.GetProperty("priority").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);
    }

    [Fact]
    public async Task UpdatePriority_UnknownOrderReturnsBadRequest()
    {
        await using var application = new WebApplicationFactory<Program>();
        using var client = application.CreateClient();

        var response = await client.PatchAsJsonAsync(
            "/orders/missing/priority",
            new { priority = "low" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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