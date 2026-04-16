using Microsoft.EntityFrameworkCore;
using TabFlow.Platform.Data;
using TabFlow.Platform.Security;
using TabFlow.Platform.Tenants;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<ProvisioningOptions>(builder.Configuration.GetSection("Provisioning"));
builder.Services.AddDbContext<PlatformDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PlatformDatabase"),
        npgsql =>
        {
            npgsql.MapEnum<TenantStatus>("tenant_status");
            npgsql.MapEnum<ProvisionJobStatus>("provision_job_status");
            npgsql.MapEnum<PlatformAdminRole>("platform_admin_role");
        }));
builder.Services.AddScoped<PlatformAuditWriter>();
builder.Services.AddScoped<ProvisioningService>();
builder.Services.AddHostedService<ProvisioningWorker>();

var host = builder.Build();
await host.RunAsync();
