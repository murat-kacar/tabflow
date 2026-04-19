using Xunit;

namespace TabFlow.Tenant.Api.Tests;

public sealed class TenantAdminOrderEndpointTests
{
    [Fact]
    public void Admin_order_create_endpoint_is_table_bound_and_guarded()
    {
        var endpoints = File.ReadAllText(FindRepoFile("apps/tenant-api/src/TabFlow.Tenant.Api/TenantEndpoints.cs"));
        var contracts = File.ReadAllText(FindRepoFile("apps/tenant-api/src/TabFlow.Tenant.Api/TenantContracts.cs"));

        Assert.Contains("adminGroup.MapPost(\"/orders\", CreateAdminOrder)", endpoints, StringComparison.Ordinal);
        Assert.Contains("CreateAdminOrderRequest", contracts, StringComparison.Ordinal);
        Assert.Contains("[\"tableId\"] = [\"Table is required.\"]", endpoints, StringComparison.Ordinal);
        Assert.Contains("[\"items\"] = [\"Order must contain at least one item.\"]", endpoints, StringComparison.Ordinal);
        Assert.Contains("Table was not found or is not active.", endpoints, StringComparison.Ordinal);
        Assert.Contains("CreateOrderForTableAsync", endpoints, StringComparison.Ordinal);
        Assert.Contains("AcquireTransactionLockAsync(db, $\"table:{tableId}\"", endpoints, StringComparison.Ordinal);
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
