using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Yenicafe.BuildingBlocks;
using Yenicafe.Platform.Api.Auth;
using Yenicafe.Platform.Api.Security;
using Yenicafe.Platform.Api.Tenants;
using Yenicafe.Platform.Data;
using Yenicafe.Platform.Security;
using Yenicafe.Platform.Tenants;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth-login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});
builder.Services.Configure<ProvisioningOptions>(builder.Configuration.GetSection("Provisioning"));
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter<TenantStatus>(JsonNamingPolicy.CamelCase));
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter<ProvisionJobStatus>(JsonNamingPolicy.CamelCase));
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter<PlatformAdminRole>(JsonNamingPolicy.CamelCase));
});
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

if (builder.Configuration.GetValue("Provisioning:EnableWorker", false))
{
    builder.Services.AddHostedService<ProvisioningWorker>();
}

var app = builder.Build();

await PlatformDatabaseInitializer.InitializeAsync(app.Services);

app.UseRateLimiter();
app.MapHealthChecks("/health/live");
app.MapGet("/health/ready", async (
    PlatformDbContext db,
    IHostEnvironment environment,
    CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new HealthResponse("ready", "platform-api", DateTimeOffset.UtcNow, environment.EnvironmentName))
        : Results.Problem("Platform database is not reachable.", statusCode: StatusCodes.Status503ServiceUnavailable));
app.MapGet("/health", (IHostEnvironment environment) =>
    new HealthResponse("ok", "platform-api", DateTimeOffset.UtcNow, environment.EnvironmentName));
app.MapAuthEndpoints();
app.MapTenantEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();
