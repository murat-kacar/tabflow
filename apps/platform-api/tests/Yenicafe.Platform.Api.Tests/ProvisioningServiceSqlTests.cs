using Xunit;

namespace Yenicafe.Platform.Api.Tests;

public sealed class ProvisioningServiceSqlTests
{
    [Fact]
    public void Provisioning_service_claims_jobs_with_lease_and_skip_locked()
    {
        var source = File.ReadAllText(FindRepoFile("packages/shared-dotnet/src/Yenicafe.Platform/Tenants/ProvisioningService.cs"));

        Assert.Contains("FOR UPDATE SKIP LOCKED", source, StringComparison.Ordinal);
        Assert.Contains("lease_until", source, StringComparison.Ordinal);
        Assert.Contains("next_attempt_at", source, StringComparison.Ordinal);
        Assert.Contains("attempt_count < @max_attempts", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Provisioning_success_does_not_mark_tenant_active_before_health_verification()
    {
        var source = File.ReadAllText(FindRepoFile("packages/shared-dotnet/src/Yenicafe.Platform/Tenants/ProvisioningService.cs"));

        Assert.DoesNotContain("tenant.Status = TenantStatus.Active", source, StringComparison.Ordinal);
        Assert.Contains("Status = \"not_checked\"", source, StringComparison.Ordinal);
        Assert.Contains("artifacts_ready", source, StringComparison.Ordinal);
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
