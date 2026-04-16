using Xunit;
using TabFlow.Platform.Api.Security;

namespace TabFlow.Platform.Api.Tests;

public sealed class PlatformPasswordHasherTests
{
    [Fact]
    public void HashProducesVerifiablePasswordHash()
    {
        var hash = PlatformPasswordHasher.Hash("correct horse battery staple");

        Assert.True(PlatformPasswordHasher.Verify("correct horse battery staple", hash));
        Assert.False(PlatformPasswordHasher.Verify("wrong password", hash));
    }
}
