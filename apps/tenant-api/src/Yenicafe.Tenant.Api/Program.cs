using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Yenicafe.BuildingBlocks;
using Yenicafe.Tenant.Api;
using Yenicafe.Tenant.Api.Data;
using Yenicafe.Tenant.Api.Orders;
using Yenicafe.Tenant.Api.Tables;

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
builder.Services.Configure<TenantRuntimeOptions>(builder.Configuration.GetSection("Tenant"));
builder.Services.AddSingleton<DeviceConnectionRegistry>();
builder.Services.AddScoped<TableTokenService>();
builder.Services.AddScoped<CustomerSessionService>();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter<CustomerOrderStatus>(JsonNamingPolicy.CamelCase));
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter<CustomerBillStatus>(JsonNamingPolicy.CamelCase));
});
builder.Services.AddDbContext<TenantDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("TenantDatabase"),
        npgsql => npgsql.MapEnum<CustomerOrderStatus>("customer_order_status")));

var app = builder.Build();

await TenantDatabaseInitializer.InitializeAsync(app.Services);

app.UseRateLimiter();
app.UseWebSockets();
app.MapHealthChecks("/health/live");
app.MapGet("/health/ready", async (
    TenantDbContext db,
    IHostEnvironment environment,
    CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new HealthResponse("ready", "tenant-api", DateTimeOffset.UtcNow, environment.EnvironmentName))
        : Results.Problem("Tenant database is not reachable.", statusCode: StatusCodes.Status503ServiceUnavailable));
app.MapGet("/health", (IHostEnvironment environment) =>
    new HealthResponse("ok", "tenant-api", DateTimeOffset.UtcNow, environment.EnvironmentName));
app.Map("/ws/masa/{tableNumber:int}", DeviceWebSocketEndpoint.HandleAsync);
app.MapTenantEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();
