using Microsoft.EntityFrameworkCore;
using TabFlow.Tenant.Api.Catalog;
using TabFlow.Tenant.Api.Kitchen;
using TabFlow.Tenant.Api.Orders;
using TabFlow.Tenant.Api.Tables;

namespace TabFlow.Tenant.Api.Data;

public sealed class TenantDbContext(DbContextOptions<TenantDbContext> options) : DbContext(options)
{
    public DbSet<TenantProfile> TenantProfiles => Set<TenantProfile>();

    public DbSet<TenantAdmin> TenantAdmins => Set<TenantAdmin>();

    public DbSet<ServiceTable> ServiceTables => Set<ServiceTable>();

    public DbSet<DeviceKey> DeviceKeys => Set<DeviceKey>();

    public DbSet<TableToken> TableTokens => Set<TableToken>();

    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();

    public DbSet<ServiceStation> ServiceStations => Set<ServiceStation>();

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    public DbSet<CustomerOrder> CustomerOrders => Set<CustomerOrder>();

    public DbSet<CustomerOrderItem> CustomerOrderItems => Set<CustomerOrderItem>();

    public DbSet<CustomerSession> CustomerSessions => Set<CustomerSession>();

    public DbSet<CustomerBill> CustomerBills => Set<CustomerBill>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresEnum<CustomerOrderStatus>("customer_order_status");

        modelBuilder.Entity<TenantProfile>(entity =>
        {
            entity.ToTable("tenant_profile");
            entity.HasKey(profile => profile.Id);
            entity.Property(profile => profile.Id).HasColumnName("id");
            entity.HasIndex(profile => profile.Code).IsUnique();
            entity.HasIndex(profile => profile.PrimaryDomain).IsUnique();
            entity.Property(profile => profile.Code).HasColumnName("code").HasMaxLength(63);
            entity.Property(profile => profile.DisplayName).HasColumnName("display_name").HasMaxLength(160);
            entity.Property(profile => profile.PrimaryDomain).HasColumnName("primary_domain").HasMaxLength(253);
            entity.Property(profile => profile.CurrencyCode).HasColumnName("currency_code").HasMaxLength(3);
            entity.Property(profile => profile.LanguageCode).HasColumnName("language_code").HasMaxLength(8);
            entity.Property(profile => profile.TimeZone).HasColumnName("time_zone").HasMaxLength(80);
            entity.Property(profile => profile.DefaultFirmwareWifiSsid).HasColumnName("default_firmware_wifi_ssid").HasMaxLength(160);
            entity.Property(profile => profile.DefaultFirmwareWifiPassword).HasColumnName("default_firmware_wifi_password").HasMaxLength(160);
            entity.Property(profile => profile.FloorLayoutJson).HasColumnName("floor_layout_json");
            entity.Property(profile => profile.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(profile => profile.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<TenantAdmin>(entity =>
        {
            entity.ToTable("tenant_admins");
            entity.HasKey(admin => admin.Id);
            entity.Property(admin => admin.Id).HasColumnName("id");
            entity.HasIndex(admin => admin.Email).IsUnique();
            entity.Property(admin => admin.Email).HasColumnName("email").HasMaxLength(254);
            entity.Property(admin => admin.PasswordHash).HasColumnName("password_hash").HasMaxLength(512);
            entity.Property(admin => admin.MustChangePassword).HasColumnName("must_change_password");
            entity.Property(admin => admin.IsActive).HasColumnName("is_active");
            entity.Property(admin => admin.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<ServiceTable>(entity =>
        {
            entity.ToTable("service_tables");
            entity.HasKey(table => table.Id);
            entity.Property(table => table.Id).HasColumnName("id");
            entity.HasIndex(table => table.Number).IsUnique();
            entity.Property(table => table.Number).HasColumnName("number");
            entity.Property(table => table.Name).HasColumnName("name").HasMaxLength(120);
            entity.Property(table => table.ServiceNote).HasColumnName("service_note").HasMaxLength(1200);
            entity.Property(table => table.LayoutCode).HasColumnName("layout_code").HasMaxLength(63);
            entity.Property(table => table.LayoutX).HasColumnName("layout_x");
            entity.Property(table => table.LayoutY).HasColumnName("layout_y");
            entity.Property(table => table.IsActive).HasColumnName("is_active");
            entity.Property(table => table.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(table => table.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<DeviceKey>(entity =>
        {
            entity.ToTable("device_keys");
            entity.HasKey(key => key.Id);
            entity.Property(key => key.Id).HasColumnName("id");
            entity.Property(key => key.TableId).HasColumnName("table_id");
            entity.HasIndex(key => key.KeyHint).IsUnique();
            entity.HasIndex(key => key.TableId);
            entity.Property(key => key.KeyHash).HasColumnName("key_hash").HasMaxLength(512);
            entity.Property(key => key.KeyHint).HasColumnName("key_hint").HasMaxLength(48);
            entity.Property(key => key.IsActive).HasColumnName("is_active");
            entity.Property(key => key.LastSeenAt).HasColumnName("last_seen_at");
            entity.Property(key => key.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.HasIndex(key => key.TableId)
                .HasFilter("is_active")
                .IsUnique();
            entity.HasOne(key => key.Table)
                .WithMany(table => table.DeviceKeys)
                .HasForeignKey(key => key.TableId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TableToken>(entity =>
        {
            entity.ToTable("table_tokens");
            entity.HasKey(token => token.Id);
            entity.Property(token => token.Id).HasColumnName("id");
            entity.HasIndex(token => token.TokenHash).IsUnique();
            entity.HasIndex(token => token.TableId);
            entity.Property(token => token.TableId).HasColumnName("table_id");
            entity.Property(token => token.TokenHash).HasColumnName("token_hash").HasMaxLength(128);
            entity.Property(token => token.ExpiresAt).HasColumnName("expires_at");
            entity.Property(token => token.ConsumedAt).HasColumnName("consumed_at");
            entity.Property(token => token.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.HasOne(token => token.Table)
                .WithMany()
                .HasForeignKey(token => token.TableId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MenuCategory>(entity =>
        {
            entity.ToTable("menu_categories");
            entity.HasKey(category => category.Id);
            entity.Property(category => category.Id).HasColumnName("id");
            entity.HasIndex(category => category.Slug).IsUnique();
            entity.Property(category => category.Slug).HasColumnName("slug").HasMaxLength(80);
            entity.Property(category => category.Name).HasColumnName("name").HasMaxLength(120);
            entity.Property(category => category.StationId).HasColumnName("station_id");
            entity.Property(category => category.SortOrder).HasColumnName("sort_order");
            entity.Property(category => category.IsActive).HasColumnName("is_active");
            entity.Property(category => category.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.HasOne(category => category.Station)
                .WithMany(station => station.Categories)
                .HasForeignKey(category => category.StationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ServiceStation>(entity =>
        {
            entity.ToTable("service_stations");
            entity.HasKey(station => station.Id);
            entity.Property(station => station.Id).HasColumnName("id");
            entity.HasIndex(station => station.Code).IsUnique();
            entity.Property(station => station.Code).HasColumnName("code").HasMaxLength(63);
            entity.Property(station => station.Name).HasColumnName("name").HasMaxLength(120);
            entity.Property(station => station.ColorHex).HasColumnName("color_hex").HasMaxLength(16);
            entity.Property(station => station.SortOrder).HasColumnName("sort_order");
            entity.Property(station => station.IsActive).HasColumnName("is_active");
            entity.Property(station => station.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(station => station.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<MenuItem>(entity =>
        {
            entity.ToTable("menu_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.HasIndex(item => item.Sku).IsUnique();
            entity.Property(item => item.CategoryId).HasColumnName("category_id");
            entity.Property(item => item.StationId).HasColumnName("station_id");
            entity.Property(item => item.Sku).HasColumnName("sku").HasMaxLength(80);
            entity.Property(item => item.Name).HasColumnName("name").HasMaxLength(160);
            entity.Property(item => item.Description).HasColumnName("description").HasMaxLength(1200);
            entity.Property(item => item.PriceMinor).HasColumnName("price_minor");
            entity.Property(item => item.CurrencyCode).HasColumnName("currency_code").HasMaxLength(3);
            entity.Property(item => item.IsAvailable).HasColumnName("is_available");
            entity.Property(item => item.SortOrder).HasColumnName("sort_order");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(item => item.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasOne(item => item.Category)
                .WithMany(category => category.Items)
                .HasForeignKey(item => item.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Station)
                .WithMany()
                .HasForeignKey(item => item.StationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CustomerOrder>(entity =>
        {
            entity.ToTable("customer_orders");
            entity.HasKey(order => order.Id);
            entity.Property(order => order.Id).HasColumnName("id");
            entity.Property(order => order.BillId).HasColumnName("bill_id");
            entity.Property(order => order.TableId).HasColumnName("table_id");
            entity.Property(order => order.Status).HasColumnName("status").HasColumnType("customer_order_status");
            entity.Property(order => order.Note).HasColumnName("note").HasMaxLength(1200);
            entity.Property(order => order.SubtotalMinor).HasColumnName("subtotal_minor");
            entity.Property(order => order.CurrencyCode).HasColumnName("currency_code").HasMaxLength(3);
            entity.Property(order => order.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(order => order.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasOne(order => order.Table)
                .WithMany()
                .HasForeignKey(order => order.TableId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(order => order.Bill)
                .WithMany(bill => bill.Orders)
                .HasForeignKey(order => order.BillId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CustomerSession>(entity =>
        {
            entity.ToTable("customer_sessions");
            entity.HasKey(session => session.Id);
            entity.Property(session => session.Id).HasColumnName("id");
            entity.HasIndex(session => session.SessionTokenHash).IsUnique();
            entity.HasIndex(session => session.TableId);
            entity.Property(session => session.TableId).HasColumnName("table_id");
            entity.Property(session => session.SessionTokenHash).HasColumnName("session_token_hash").HasMaxLength(128);
            entity.Property(session => session.OpenedAt).HasColumnName("opened_at").HasDefaultValueSql("now()");
            entity.Property(session => session.ExpiresAt).HasColumnName("expires_at");
            entity.Property(session => session.ClosedAt).HasColumnName("closed_at");
            entity.Property(session => session.LastSeenAt).HasColumnName("last_seen_at").HasDefaultValueSql("now()");
            entity.HasOne(session => session.Table)
                .WithMany()
                .HasForeignKey(session => session.TableId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CustomerBill>(entity =>
        {
            entity.ToTable("customer_bills");
            entity.HasKey(bill => bill.Id);
            entity.Property(bill => bill.Id).HasColumnName("id");
            entity.HasIndex(bill => bill.TableId);
            entity.HasIndex(bill => bill.TableId)
                .HasFilter("closed_at IS NULL")
                .IsUnique();
            entity.Property(bill => bill.TableId).HasColumnName("table_id");
            entity.Property(bill => bill.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(24);
            entity.Property(bill => bill.SubtotalMinor).HasColumnName("subtotal_minor");
            entity.Property(bill => bill.CurrencyCode).HasColumnName("currency_code").HasMaxLength(3);
            entity.Property(bill => bill.OpenedAt).HasColumnName("opened_at").HasDefaultValueSql("now()");
            entity.Property(bill => bill.ClosedAt).HasColumnName("closed_at");
            entity.Property(bill => bill.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasOne(bill => bill.Table)
                .WithMany()
                .HasForeignKey(bill => bill.TableId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CustomerOrderItem>(entity =>
        {
            entity.ToTable("customer_order_items");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.OrderId).HasColumnName("order_id");
            entity.Property(item => item.MenuItemId).HasColumnName("menu_item_id");
            entity.Property(item => item.Quantity).HasColumnName("quantity");
            entity.Property(item => item.UnitPriceMinor).HasColumnName("unit_price_minor");
            entity.Property(item => item.LineTotalMinor).HasColumnName("line_total_minor");
            entity.Property(item => item.Status).HasColumnName("status").HasColumnType("customer_order_status");
            entity.Property(item => item.Note).HasColumnName("note").HasMaxLength(600);
            entity.HasOne(item => item.Order)
                .WithMany(order => order.Items)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.MenuItem)
                .WithMany()
                .HasForeignKey(item => item.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
