using Xunit;

namespace TabFlow.Tenant.Api.Tests;

public sealed class AuthRateLimitTests
{
    [Fact]
    public void Tenant_admin_login_endpoint_requires_rate_limiting()
    {
        var program = File.ReadAllText(FindRepoFile("apps/tenant-api/src/TabFlow.Tenant.Api/Program.cs"));
        var endpoints = File.ReadAllText(FindRepoFile("apps/tenant-api/src/TabFlow.Tenant.Api/TenantEndpoints.cs"));

        Assert.Contains("AddRateLimiter", program, StringComparison.Ordinal);
        Assert.Contains("auth-login", program, StringComparison.Ordinal);
        Assert.Contains("RequireRateLimiting(\"auth-login\")", endpoints, StringComparison.Ordinal);
    }

    private static string FindRepoFile(string relativePath)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, relativePath);
            if (File.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        throw new FileNotFoundException($"Could not find {relativePath} from {AppContext.BaseDirectory}.");
    }
}
