using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TabFlow.Tenant.Api.Catalog;
using TabFlow.Tenant.Api.Data;
using TabFlow.Tenant.Api.Kitchen;
using TabFlow.Tenant.Api.Tables;

namespace TabFlow.Tenant.Api;

public static class TenantDatabaseInitializer
{
    private static readonly JsonSerializerOptions DeviceKeySeedJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static async Task InitializeAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<TenantDbContext>();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<TenantRuntimeOptions>>().Value;

        await EnsureSchemaAsync(db);
        await EnsureSeedDataAsync(db, options);
    }

    private static async Task EnsureSchemaAsync(TenantDbContext db)
    {
        await db.Database.OpenConnectionAsync();

        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = LoadSchemaSql();
            await command.ExecuteNonQueryAsync();
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    private static string LoadSchemaSql()
    {
        using var stream = Assembly
            .GetExecutingAssembly()
            .GetManifestResourceStream("TenantSchema.sql")
            ?? throw new InvalidOperationException("Embedded tenant schema SQL not found.");
        using var reader = new StreamReader(stream);

        return reader.ReadToEnd();
    }

    private static async Task EnsureSeedDataAsync(TenantDbContext db, TenantRuntimeOptions options)
    {
        if (!await db.TenantProfiles.AnyAsync())
        {
            db.TenantProfiles.Add(new TenantProfile
            {
                Code = CatalogValidation.NormalizeCode(options.Code),
                DisplayName = options.DisplayName.Trim(),
                PrimaryDomain = CatalogValidation.NormalizeHost(options.BaseUrl),
                CurrencyCode = CatalogValidation.NormalizeCurrency(options.CurrencyCode)
            });
        }

        if (!await db.ServiceTables.AnyAsync())
        {
            for (var tableNumber = 1; tableNumber <= Math.Max(1, options.InitialTableCount); tableNumber++)
            {
                db.ServiceTables.Add(new ServiceTable
                {
                    Number = tableNumber,
                    Name = $"Masa {tableNumber:000}"
                });
            }
        }

        if (!await db.MenuCategories.AnyAsync())
        {
            var stations = await EnsureDefaultStationsAsync(db);
            var barStation = stations.First(station => station.Code == "bar");
            var dessertStation = stations.First(station => station.Code == "dessert");

            var hotDrinks = new MenuCategory
            {
                Slug = "hot-drinks",
                Name = "Sicak Icecekler",
                StationId = barStation.Id,
                SortOrder = 10
            };
            hotDrinks.Items.Add(new MenuItem
            {
                Sku = "espresso",
                Name = "Espresso",
                Description = "Tek shot espresso",
                PriceMinor = 900,
                CurrencyCode = CatalogValidation.NormalizeCurrency(options.CurrencyCode),
                SortOrder = 10
            });
            hotDrinks.Items.Add(new MenuItem
            {
                Sku = "latte",
                Name = "Latte",
                Description = "Kadifemsi sut ile latte",
                PriceMinor = 1200,
                CurrencyCode = CatalogValidation.NormalizeCurrency(options.CurrencyCode),
                SortOrder = 20
            });

            var desserts = new MenuCategory
            {
                Slug = "desserts",
                Name = "Tatlilar",
                StationId = dessertStation.Id,
                SortOrder = 20
            };
            desserts.Items.Add(new MenuItem
            {
                Sku = "san-sebastian",
                Name = "San Sebastian",
                Description = "Gunun cheesecake secimi",
                PriceMinor = 1500,
                CurrencyCode = CatalogValidation.NormalizeCurrency(options.CurrencyCode),
                SortOrder = 10
            });

            db.MenuCategories.AddRange(hotDrinks, desserts);
        }
        else
        {
            await EnsureDefaultStationsAsync(db);
        }

        if (!await db.DeviceKeys.AnyAsync())
        {
            var tables = await db.ServiceTables.OrderBy(table => table.Number).ToListAsync();
            foreach (var seed in ReadDeviceKeySeeds(options))
            {
                var table = tables.FirstOrDefault(current => current.Number == seed.TableNumber);
                if (table is null)
                {
                    continue;
                }

                db.DeviceKeys.Add(new DeviceKey
                {
                    TableId = table.Id,
                    KeyHash = DeviceKeyService.Hash(seed.DeviceKey),
                    KeyHint = DeviceKeyService.CreateHint(seed.DeviceKey)
                });
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task<IReadOnlyList<ServiceStation>> EnsureDefaultStationsAsync(TenantDbContext db)
    {
        var defaults = new[]
        {
            new ServiceStation { Code = "bar", Name = "Bar", ColorHex = "#2563eb", SortOrder = 10 },
            new ServiceStation { Code = "kitchen", Name = "Mutfak", ColorHex = "#ea580c", SortOrder = 20 },
            new ServiceStation { Code = "dessert", Name = "Tatli", ColorHex = "#db2777", SortOrder = 30 }
        };

        foreach (var station in defaults)
        {
            if (await db.ServiceStations.AnyAsync(current => current.Code == station.Code))
            {
                continue;
            }

            db.ServiceStations.Add(station);
        }

        await db.SaveChangesAsync();
        return await db.ServiceStations.OrderBy(station => station.SortOrder).ToListAsync();
    }

    internal static IReadOnlyList<DeviceKeySeed> ReadDeviceKeySeeds(TenantRuntimeOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.DeviceKeySeedJson))
        {
            return [];
        }

        return JsonSerializer.Deserialize<DeviceKeySeed[]>(
            options.DeviceKeySeedJson,
            DeviceKeySeedJsonOptions) ?? [];
    }

    internal sealed record DeviceKeySeed(int TableNumber, string DeviceKey);
}
