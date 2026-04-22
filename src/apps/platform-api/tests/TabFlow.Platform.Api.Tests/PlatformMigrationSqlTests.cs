using Xunit;

namespace TabFlow.Platform.Api.Tests;

public sealed class PlatformMigrationSqlTests
{
    [Fact]
    public void Initial_migration_adds_provisioning_claim_columns_idempotently()
    {
        var sql = File.ReadAllText(FindRepoFile("src/infra/postgres/migrations/platform/0001_initial.sql"));

        Assert.Contains("ADD COLUMN IF NOT EXISTS worker_id", sql, StringComparison.Ordinal);
        Assert.Contains("ADD COLUMN IF NOT EXISTS lease_until", sql, StringComparison.Ordinal);
        Assert.Contains("ADD COLUMN IF NOT EXISTS next_attempt_at", sql, StringComparison.Ordinal);
        Assert.Contains("platform_provision_jobs_claimable", sql, StringComparison.Ordinal);
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
