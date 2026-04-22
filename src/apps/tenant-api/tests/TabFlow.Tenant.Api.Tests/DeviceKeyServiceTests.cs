using Xunit;
using TabFlow.Tenant.Api.Tables;

namespace TabFlow.Tenant.Api.Tests;

public sealed class DeviceKeyServiceTests
{
    [Fact]
    public void GenerateAndVerifyRoundTrips()
    {
        var rawKey = DeviceKeyService.GenerateRawKey(12);
        var hash = DeviceKeyService.Hash(rawKey);

        Assert.Contains("masa012", rawKey);
        Assert.True(DeviceKeyService.Verify(rawKey, hash));
        Assert.False(DeviceKeyService.Verify("wrong-key", hash));
    }

    [Fact]
    public void CreateHintKeepsReadableSuffix()
    {
        var hint = DeviceKeyService.CreateHint("abcdef123456-masa101");

        Assert.Contains("masa101", hint);
    }
}
