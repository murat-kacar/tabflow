using System.Security.Cryptography;
using System.Text;

namespace TabFlow.Platform.Api.Security;

public sealed class PlatformAdminKeyEndpointFilter(IConfiguration configuration) : IEndpointFilter
{
    private const string HeaderName = "X-Platform-Admin-Key";

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var configuredKey = configuration["PlatformAdmin:ApiKey"];

        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            return Results.Problem(
                "Platform admin API key is not configured.",
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
