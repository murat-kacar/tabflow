using Xunit;

namespace TabFlow.Platform.Api.Tests;

public sealed class AuthRateLimitTests
{
    [Fact]
    public void Platform_login_endpoint_requires_rate_limiting()
    {
        var program = File.ReadAllText(FindRepoFile("src/apps/platform-api/src/TabFlow.Platform.Api/Program.cs"));
        var authEndpoints = File.ReadAllText(FindRepoFile("src/apps/platform-api/src/TabFlow.Platform.Api/Auth/AuthEndpoints.cs"));

        Assert.Contains("AddRateLimiter", program, StringComparison.Ordinal);
        Assert.Contains("auth-login", program, StringComparison.Ordinal);
        Assert.Contains("RequireRateLimiting(\"auth-login\")", authEndpoints, StringComparison.Ordinal);
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
