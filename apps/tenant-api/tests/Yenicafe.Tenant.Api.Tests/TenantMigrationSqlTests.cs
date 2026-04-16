using Xunit;

namespace Yenicafe.Tenant.Api.Tests;

public sealed class TenantMigrationSqlTests
{
    [Fact]
    public void Initial_migration_adds_menu_category_station_foreign_key_idempotently()
    {
        var sql = File.ReadAllText(FindRepoFile("infra/postgres/migrations/tenant/0001_initial.sql"));

        Assert.Contains("fk_menu_categories_station_id", sql, StringComparison.Ordinal);
        Assert.Contains("pg_constraint", sql, StringComparison.Ordinal);
        Assert.Contains("FOREIGN KEY (station_id) REFERENCES service_stations (id) ON DELETE SET NULL", sql, StringComparison.Ordinal);
    }

    [Fact]
    public void Initial_migration_enforces_one_active_device_key_per_table()
    {
        var sql = File.ReadAllText(FindRepoFile("infra/postgres/migrations/tenant/0001_initial.sql"));

        Assert.Contains("ux_device_keys_one_active_per_table", sql, StringComparison.Ordinal);
        Assert.Contains("WHERE is_active", sql, StringComparison.Ordinal);
        Assert.Contains("ROW_NUMBER() OVER (PARTITION BY table_id", sql, StringComparison.Ordinal);
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
