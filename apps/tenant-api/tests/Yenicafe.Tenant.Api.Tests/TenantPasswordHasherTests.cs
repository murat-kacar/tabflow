using Xunit;
using Yenicafe.Tenant.Api.Auth;

namespace Yenicafe.Tenant.Api.Tests;

public sealed class TenantPasswordHasherTests
{
    [Fact]
    public void HashProducesVerifiablePasswordHash()
    {
        var hash = TenantPasswordHasher.Hash("correct horse battery staple");

        Assert.True(TenantPasswordHasher.Verify("correct horse battery staple", hash));
        Assert.False(TenantPasswordHasher.Verify("wrong password", hash));
    }
}
