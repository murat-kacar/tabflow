using Xunit;

namespace TabFlow.Platform.Api.Tests;

public sealed class PlatformNamespaceConventionTests
{
    [Fact]
    public void Shared_platform_package_does_not_use_api_namespaces()
    {
        var root = FindRepoDirectory("src/packages/shared-dotnet/src/TabFlow.Platform");
        var files = Directory.GetFiles(root, "*.cs", SearchOption.AllDirectories);

        foreach (var file in files)
        {
            var source = File.ReadAllText(file);
            Assert.DoesNotContain("TabFlow.Platform.Api.", source, StringComparison.Ordinal);
        }
    }

    private static string FindRepoDirectory(string relativePath)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, relativePath);
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException($"Could not find {relativePath} from {AppContext.BaseDirectory}.");
    }
}
