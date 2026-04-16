using System.Text.Json;
using Xunit;

namespace Yenicafe.Tenant.Api.Tests;

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
}
