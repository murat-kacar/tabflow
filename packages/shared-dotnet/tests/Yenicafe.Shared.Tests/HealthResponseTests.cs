using Xunit;
using Yenicafe.BuildingBlocks;

namespace Yenicafe.BuildingBlocks.Tests;

public sealed class HealthResponseTests
{
    [Fact]
    public void HealthResponseStoresServiceMetadata()
    {
        var now = DateTimeOffset.UtcNow;
        var response = new HealthResponse("ok", "platform-api", now, "Testing");

        Assert.Equal("ok", response.Status);
        Assert.Equal("platform-api", response.Service);
        Assert.Equal(now, response.Time);
        Assert.Equal("Testing", response.Environment);
    }
}
