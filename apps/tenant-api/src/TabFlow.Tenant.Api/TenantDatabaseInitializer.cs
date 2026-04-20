using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TabFlow.Tenant.Api.Auth;
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

    internal static string ResolveInitialAdminEmail(TenantRuntimeOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.InitialAdminEmail))
        {
            return options.InitialAdminEmail.Trim().ToLowerInvariant();
        }

        return $"admin@{CatalogValidation.NormalizeCode(options.Code)}.tabflow.uk";
    }

    internal static string NormalizeLanguageCode(string languageCode) =>
        languageCode.Trim().ToLowerInvariant() is "tr" ? "tr" : "en";

    internal static string NormalizeTimeZone(string timeZone)
    {
        var normalized = timeZone.Trim();
        return normalized is "Europe/Istanbul" or "UTC" ? normalized : "Europe/London";
    }

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
            command.CommandText = $"{LoadSchemaSql()}\n{LoadSchemaUpgradeSql()}";
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

    private static string LoadSchemaUpgradeSql()
    {
        return
            """
            ALTER TABLE service_tables
            ADD COLUMN IF NOT EXISTS layout_code varchar(63) NOT NULL DEFAULT 'ana-kat';

            ALTER TABLE service_tables
            ADD COLUMN IF NOT EXISTS layout_x integer NOT NULL DEFAULT 0;

            ALTER TABLE service_tables
            ADD COLUMN IF NOT EXISTS layout_y integer NOT NULL DEFAULT 0;

            ALTER TABLE tenant_profile
            ADD COLUMN IF NOT EXISTS floor_layout_json text NOT NULL DEFAULT '{}';

            ALTER TABLE tenant_profile
            ADD COLUMN IF NOT EXISTS language_code varchar(8) NOT NULL DEFAULT 'en';

            ALTER TABLE tenant_profile
            ADD COLUMN IF NOT EXISTS time_zone varchar(80) NOT NULL DEFAULT 'Europe/London';

            ALTER TABLE tenant_profile
            ADD COLUMN IF NOT EXISTS default_firmware_wifi_ssid varchar(160) NOT NULL DEFAULT 'CHANGE_ME';

            ALTER TABLE tenant_profile
            ADD COLUMN IF NOT EXISTS default_firmware_wifi_password varchar(160) NOT NULL DEFAULT 'CHANGE_ME';

            ALTER TABLE menu_items
            ADD COLUMN IF NOT EXISTS station_id uuid NULL;

            CREATE INDEX IF NOT EXISTS ix_menu_items_station_id ON menu_items (station_id);

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_menu_items_station_id'
                      AND conrelid = 'menu_items'::regclass
                ) THEN
                    ALTER TABLE menu_items
                        ADD CONSTRAINT fk_menu_items_station_id
                        FOREIGN KEY (station_id) REFERENCES service_stations (id) ON DELETE SET NULL;
                END IF;
            END $$;
            """;
    }

    private static async Task EnsureSeedDataAsync(TenantDbContext db, TenantRuntimeOptions options)
    {
        var normalizedLanguageCode = NormalizeLanguageCode(options.LanguageCode);
        var normalizedCurrencyCode = CatalogValidation.NormalizeCurrency(options.CurrencyCode);
        var normalizedTimeZone = NormalizeTimeZone(options.TimeZone);
        var normalizedFirmwareWifiSsid = string.IsNullOrWhiteSpace(options.DefaultFirmwareWifiSsid)
            ? "CHANGE_ME"
            : options.DefaultFirmwareWifiSsid.Trim();
        var normalizedFirmwareWifiPassword = string.IsNullOrWhiteSpace(options.DefaultFirmwareWifiPassword)
            ? "CHANGE_ME"
            : options.DefaultFirmwareWifiPassword.Trim();

        var profile = await db.TenantProfiles.OrderBy(profile => profile.CreatedAt).FirstOrDefaultAsync();
        if (profile is null)
        {
            db.TenantProfiles.Add(new TenantProfile
            {
                Code = CatalogValidation.NormalizeCode(options.Code),
                DisplayName = options.DisplayName.Trim(),
                PrimaryDomain = CatalogValidation.NormalizeHost(options.BaseUrl),
                CurrencyCode = normalizedCurrencyCode,
                LanguageCode = normalizedLanguageCode,
                TimeZone = normalizedTimeZone,
                DefaultFirmwareWifiSsid = normalizedFirmwareWifiSsid,
                DefaultFirmwareWifiPassword = normalizedFirmwareWifiPassword
            });
        }
        else
        {
            profile.DisplayName = options.DisplayName.Trim();
            profile.PrimaryDomain = CatalogValidation.NormalizeHost(options.BaseUrl);
            profile.CurrencyCode = normalizedCurrencyCode;
            profile.LanguageCode = normalizedLanguageCode;
            profile.TimeZone = normalizedTimeZone;
            profile.DefaultFirmwareWifiSsid = normalizedFirmwareWifiSsid;
            profile.DefaultFirmwareWifiPassword = normalizedFirmwareWifiPassword;
            profile.UpdatedAt = DateTimeOffset.UtcNow;
        }

        if (!await db.TenantAdmins.AnyAsync(admin => admin.IsActive))
        {
            db.TenantAdmins.Add(new TenantAdmin
            {
                Email = ResolveInitialAdminEmail(options),
                PasswordHash = TenantPasswordHasher.Hash(TenantRuntimeOptions.DefaultAdminPassword),
                MustChangePassword = true
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
                StationId = barStation.Id,
                PriceMinor = 900,
                CurrencyCode = CatalogValidation.NormalizeCurrency(options.CurrencyCode),
                SortOrder = 10
            });
            hotDrinks.Items.Add(new MenuItem
            {
                Sku = "latte",
                Name = "Latte",
                Description = "Kadifemsi sut ile latte",
                StationId = barStation.Id,
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
                StationId = dessertStation.Id,
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
