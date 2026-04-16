using Xunit;
using TabFlow.Tenant.Api.Tables;

namespace TabFlow.Tenant.Api.Tests;

public sealed class QrMatrixEncoderTests
{
    [Fact]
    public void EncodeUrlProducesPackedPayload()
    {
        var payload = QrMatrixEncoder.EncodeUrl("https://demo.example.com/g/F6F83B6A11653E");

        Assert.True(payload.Side >= 21);
        Assert.True(payload.Side % 4 == 1);
        Assert.Equal(((payload.Side * payload.Side) + 7) / 8 * 2, payload.BitsHex.Length);
        Assert.NotEqual(new string('0', payload.BitsHex.Length), payload.BitsHex);
    }

    [Fact]
    public void EncodeUrlSupportsLongerDomains()
    {
        var oversized = "https://really-long-tenant-subdomain-name.example.com/g/" + new string('A', 48);

        var payload = QrMatrixEncoder.EncodeUrl(oversized);

        Assert.True(payload.Side > 33);
        Assert.Equal(((payload.Side * payload.Side) + 7) / 8 * 2, payload.BitsHex.Length);
    }
}
