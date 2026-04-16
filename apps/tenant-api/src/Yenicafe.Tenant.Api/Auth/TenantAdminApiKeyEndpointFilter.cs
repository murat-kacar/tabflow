using System.Security.Cryptography;
using System.Text;

namespace Yenicafe.Tenant.Api.Auth;

public sealed class TenantAdminApiKeyEndpointFilter(IConfiguration configuration) : IEndpointFilter
{
    private const string HeaderName = "X-Tenant-Admin-Key";

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var configuredKey = configuration["TenantAdmin:ApiKey"];

        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            return Results.Problem(
                "Tenant admin API key is not configured.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var providedKey = context.HttpContext.Request.Headers[HeaderName].ToString();

        if (!Matches(configuredKey, providedKey))
        {
            return Results.Unauthorized();
        }

        return await next(context);
    }

    private static bool Matches(string configuredKey, string providedKey)
    {
        if (string.IsNullOrEmpty(providedKey))
        {
            return false;
        }

        var configuredBytes = Encoding.UTF8.GetBytes(configuredKey);
        var providedBytes = Encoding.UTF8.GetBytes(providedKey);

        return configuredBytes.Length == providedBytes.Length
            && CryptographicOperations.FixedTimeEquals(configuredBytes, providedBytes);
    }
}
