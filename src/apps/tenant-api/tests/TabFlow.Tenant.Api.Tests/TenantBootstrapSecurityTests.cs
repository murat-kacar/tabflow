using Xunit;

namespace TabFlow.Tenant.Api.Tests;

public sealed class TenantBootstrapSecurityTests
{
    [Fact]
    public void Bootstrap_endpoint_requires_configured_email_or_token_guard()
    {
        var source = File.ReadAllText(FindRepoFile("src/apps/tenant-api/src/TabFlow.Tenant.Api/TenantEndpoints.cs"));

        Assert.Contains("InitialAdminEmail", source, StringComparison.Ordinal);
        Assert.Contains("BootstrapToken", source, StringComparison.Ordinal);
        Assert.Contains("X-Tenant-Bootstrap-Token", source, StringComparison.Ordinal);
        Assert.Contains("Tenant bootstrap is not configured.", source, StringComparison.Ordinal);
        Assert.Contains("change-password", source, StringComparison.Ordinal);
        Assert.Contains("MustChangePassword", source, StringComparison.Ordinal);
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
