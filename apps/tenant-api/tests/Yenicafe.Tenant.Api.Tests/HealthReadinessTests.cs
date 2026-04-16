using Xunit;

namespace Yenicafe.Tenant.Api.Tests;

public sealed class HealthReadinessTests
{
    [Fact]
    public void Tenant_api_exposes_database_readiness_probe()
    {
        var program = File.ReadAllText(FindRepoFile("apps/tenant-api/src/Yenicafe.Tenant.Api/Program.cs"));

        Assert.Contains("/health/ready", program, StringComparison.Ordinal);
        Assert.Contains("CanConnectAsync", program, StringComparison.Ordinal);
        Assert.Contains("Tenant database is not reachable.", program, StringComparison.Ordinal);
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
