using Xunit;
using Yenicafe.Platform.Api.Tenants;

namespace Yenicafe.Platform.Api.Tests;

public sealed class TenantValidationTests
{
    [Theory]
    [InlineData("Moda", "moda")]
    [InlineData("  besiktas-carsi  ", "besiktas-carsi")]
    public void NormalizeCodeReturnsLowercaseTrimmedCode(string input, string expected)
    {
        Assert.Equal(expected, TenantValidation.NormalizeCode(input));
    }

    [Theory]
    [InlineData("moda")]
    [InlineData("besiktas-01")]
    [InlineData("tenant123")]
    public void IsValidCodeAcceptsSafeTenantCodes(string code)
    {
        Assert.True(TenantValidation.IsValidCode(code));
    }

    [Theory]
    [InlineData("ab")]
    [InlineData("-moda")]
    [InlineData("moda-")]
    [InlineData("Moda")]
    [InlineData("moda_cafe")]
    public void IsValidCodeRejectsUnsafeTenantCodes(string code)
    {
        Assert.False(TenantValidation.IsValidCode(code));
    }

    [Theory]
    [InlineData("MODA.EXAMPLE.COM.", "moda.example.com")]
    [InlineData(" demo.example.com ", "demo.example.com")]
    public void NormalizeHostReturnsLowercaseTrimmedHostname(string input, string expected)
    {
        Assert.Equal(expected, TenantValidation.NormalizeHost(input));
    }

    [Theory]
    [InlineData("moda.example.com")]
    [InlineData("admin.example.co")]
    public void IsValidHostAcceptsHostnames(string host)
    {
        Assert.True(TenantValidation.IsValidHost(host));
    }

    [Theory]
    [InlineData("localhost")]
    [InlineData("https://moda.example.com")]
    [InlineData("-moda.example.com")]
    [InlineData("moda..example.com")]
    public void IsValidHostRejectsInvalidHostnames(string host)
    {
        Assert.False(TenantValidation.IsValidHost(host));
    }
}
