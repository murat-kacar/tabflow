using Xunit;
using Yenicafe.Tenant.Api.Catalog;

namespace Yenicafe.Tenant.Api.Tests;

public sealed class CatalogValidationTests
{
    [Theory]
    [InlineData(" Demo ", "demo")]
    [InlineData("Moda-Cafe", "moda-cafe")]
    public void NormalizeCodeReturnsTrimmedLowercase(string input, string expected)
    {
        Assert.Equal(expected, CatalogValidation.NormalizeCode(input));
    }

    [Theory]
    [InlineData("https://demo.example.com/", "demo.example.com")]
    [InlineData(" admin.example.com ", "admin.example.com")]
    public void NormalizeHostRemovesSchemeAndTrailingSlash(string input, string expected)
    {
        Assert.Equal(expected, CatalogValidation.NormalizeHost(input));
    }

    [Theory]
    [InlineData("Hot Drinks", "hot-drinks")]
    [InlineData("Tatli & Pasta", "tatli--pasta")]
    public void NormalizeSlugBuildsSafeSlug(string input, string expected)
    {
        Assert.Equal(expected, CatalogValidation.NormalizeSlug(input));
    }

    [Theory]
    [InlineData("moda")]
    [InlineData("example-01")]
    public void IsValidTenantCodeAcceptsExpectedCodes(string code)
    {
        Assert.True(CatalogValidation.IsValidTenantCode(code));
    }

    [Theory]
    [InlineData("ab")]
    [InlineData("moda_01")]
    [InlineData("-moda")]
    public void IsValidTenantCodeRejectsUnsafeCodes(string code)
    {
        Assert.False(CatalogValidation.IsValidTenantCode(code));
    }
}
