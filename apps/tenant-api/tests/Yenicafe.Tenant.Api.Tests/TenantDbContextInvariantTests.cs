using Xunit;

namespace Yenicafe.Tenant.Api.Tests;

public sealed class TenantDbContextInvariantTests
{
    [Fact]
    public void Tenant_db_context_declares_core_unique_indexes()
    {
        var source = File.ReadAllText(FindRepoFile("apps/tenant-api/src/Yenicafe.Tenant.Api/Data/TenantDbContext.cs"));

        Assert.Contains("profile => profile.Code", source, StringComparison.Ordinal);
        Assert.Contains("admin => admin.Email", source, StringComparison.Ordinal);
        Assert.Contains("table => table.Number", source, StringComparison.Ordinal);
        Assert.Contains("token => token.TokenHash", source, StringComparison.Ordinal);
        Assert.Contains("item => item.Sku", source, StringComparison.Ordinal);
        Assert.Contains("closed_at IS NULL", source, StringComparison.Ordinal);
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
