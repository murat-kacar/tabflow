using Xunit;

namespace Yenicafe.Platform.Api.Tests;

public sealed class HealthReadinessTests
{
    [Fact]
    public void Platform_api_exposes_database_readiness_probe()
    {
        var program = File.ReadAllText(FindRepoFile("apps/platform-api/src/Yenicafe.Platform.Api/Program.cs"));

        Assert.Contains("/health/ready", program, StringComparison.Ordinal);
        Assert.Contains("CanConnectAsync", program, StringComparison.Ordinal);
        Assert.Contains("Platform database is not reachable.", program, StringComparison.Ordinal);
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
