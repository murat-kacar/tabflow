using System.Text.Json;
using Xunit;

namespace TabFlow.Tenant.Api.Tests;

public sealed class TenantDatabaseInitializerTests
{
    [Fact]
    public void ReadDeviceKeySeeds_accepts_provisioned_camel_case_json()
    {
        var options = new TenantRuntimeOptions
        {
            DeviceKeySeedJson =
                """[{"tableNumber":1,"deviceKey":"demo-masa001-key"},{"tableNumber":2,"deviceKey":"demo-masa002-key"}]"""
        };

        var seeds = TenantDatabaseInitializer.ReadDeviceKeySeeds(options);

        Assert.Collection(
            seeds,
            seed =>
            {
                Assert.Equal(1, seed.TableNumber);
                Assert.Equal("demo-masa001-key", seed.DeviceKey);
            },
            seed =>
            {
                Assert.Equal(2, seed.TableNumber);
                Assert.Equal("demo-masa002-key", seed.DeviceKey);
            });
    }

    [Fact]
    public void ReadDeviceKeySeeds_rejects_malformed_json()
    {
        var options = new TenantRuntimeOptions
        {
            DeviceKeySeedJson = "{not-json"
        };

        Assert.Throws<JsonException>(() => TenantDatabaseInitializer.ReadDeviceKeySeeds(options));
    }

    [Fact]
    public void ResolveInitialAdminEmail_uses_explicit_value_when_configured()
    {
        var options = new TenantRuntimeOptions
        {
            Code = "moda",
            InitialAdminEmail = "Admin@Moda.TabFlow.Uk"
        };

        var email = TenantDatabaseInitializer.ResolveInitialAdminEmail(options);

        Assert.Equal("admin@moda.tabflow.uk", email);
    }

    [Fact]
    public void ResolveInitialAdminEmail_falls_back_to_tenant_code_domain()
    {
        var options = new TenantRuntimeOptions
        {
            Code = "moda-cafe"
        };

        var email = TenantDatabaseInitializer.ResolveInitialAdminEmail(options);

        Assert.Equal("admin@moda-cafe.tabflow.uk", email);
    }
}
