using Xunit;

namespace Yenicafe.Platform.Api.Tests;

public sealed class RuntimeSecretsBoundaryTests
{
    [Fact]
    public void Runtime_secret_artifacts_are_gitignored()
    {
        var gitignore = File.ReadAllText(FindRepoFile(".gitignore"));

        Assert.Contains("runtime/generated/", gitignore, StringComparison.Ordinal);
        Assert.Contains("runtime-config.json", gitignore, StringComparison.Ordinal);
        Assert.Contains("config.h", gitignore, StringComparison.Ordinal);
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
