using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Xunit;
using TabFlow.Tenant.Api.Auth;

namespace TabFlow.Tenant.Api.Tests;

public sealed class TenantAdminApiKeyEndpointFilterTests
{
    [Fact]
    public async Task InvokeAsyncRejectsWhenApiKeyIsNotConfigured()
    {
        var filter = new TenantAdminApiKeyEndpointFilter(new ConfigurationBuilder().Build());

        var result = await filter.InvokeAsync(
            new TestEndpointFilterInvocationContext(new DefaultHttpContext()),
            _ => new ValueTask<object?>("next"));

        AssertStatusCode(result, StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public async Task InvokeAsyncRejectsWhenApiKeyDoesNotMatch()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Tenant-Admin-Key"] = "wrong-key";
        var filter = new TenantAdminApiKeyEndpointFilter(BuildConfiguration("correct-key"));

        var result = await filter.InvokeAsync(
            new TestEndpointFilterInvocationContext(httpContext),
            _ => new ValueTask<object?>("next"));

        AssertStatusCode(result, StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task InvokeAsyncContinuesWhenApiKeyMatches()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Tenant-Admin-Key"] = "correct-key";
        var filter = new TenantAdminApiKeyEndpointFilter(BuildConfiguration("correct-key"));

        var result = await filter.InvokeAsync(
            new TestEndpointFilterInvocationContext(httpContext),
            _ => new ValueTask<object?>("next"));

        Assert.Equal("next", result);
    }

    private static IConfiguration BuildConfiguration(string apiKey) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TenantAdmin:ApiKey"] = apiKey
            })
            .Build();

    private static void AssertStatusCode(object? result, int expectedStatusCode)
    {
        var typedResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(result);

        Assert.Equal(expectedStatusCode, typedResult.StatusCode);
    }

    private sealed class TestEndpointFilterInvocationContext(HttpContext httpContext) : EndpointFilterInvocationContext
    {
        public override HttpContext HttpContext { get; } = httpContext;

        public override IList<object?> Arguments { get; } = [];

        public override T GetArgument<T>(int index) => (T)Arguments[index]!;
    }
}
