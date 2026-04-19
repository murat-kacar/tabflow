using Xunit;

namespace TabFlow.Tenant.Api.Tests;

public sealed class TenantConcurrencyGuardTests
{
    [Fact]
    public void Table_token_verify_consumes_token_with_conditional_update()
    {
        var source = File.ReadAllText(FindRepoFile("apps/tenant-api/src/TabFlow.Tenant.Api/Tables/TableTokenService.cs"));

        Assert.Contains("UPDATE table_tokens", source, StringComparison.Ordinal);
        Assert.Contains("consumed_at IS NULL", source, StringComparison.Ordinal);
        Assert.Contains("expires_at > @now", source, StringComparison.Ordinal);
        Assert.Contains("RETURNING table_id", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Table_scoped_mutations_use_advisory_transaction_locks()
    {
        var endpoints = File.ReadAllText(FindRepoFile("apps/tenant-api/src/TabFlow.Tenant.Api/TenantEndpoints.cs"));
        var bills = File.ReadAllText(FindRepoFile("apps/tenant-api/src/TabFlow.Tenant.Api/Orders/CustomerBillService.cs"));

        Assert.Contains("tenant-admin-bootstrap", endpoints, StringComparison.Ordinal);
        Assert.Contains("AcquireTransactionLockAsync(db, $\"table:{tableId}\"", endpoints, StringComparison.Ordinal);
        Assert.Contains("AcquireTransactionLockAsync(db, $\"table:{billSnapshot.TableId}\"", bills, StringComparison.Ordinal);
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
