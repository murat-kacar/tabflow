using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TabFlow.Platform.Api.Security;
using TabFlow.Platform.Data;
using TabFlow.Platform.Security;

namespace TabFlow.Platform.Api.Auth;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/platform/auth").WithTags("Platform Auth");

        group.MapGet("/bootstrap-status", GetBootstrapStatus);
        group.MapPost("/login", Login).RequireRateLimiting("auth-login");

        return group;
    }

    private static async Task<IResult> GetBootstrapStatus(
        PlatformDbContext db,
        CancellationToken cancellationToken)
    {
        var hasAdmins = await db.PlatformAdmins.AnyAsync(cancellationToken);
        return Results.Ok(new BootstrapStatusResponse(!hasAdmins));
    }

    private static async Task<IResult> Login(
        LoginRequest request,
        PlatformDbContext db,
        PlatformAuditWriter auditWriter,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Email is required."],
                ["password"] = ["Password is required."]
            });
        }

        var admin = await db.PlatformAdmins
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Email == email && current.IsActive, cancellationToken);

        if (admin is null || !PlatformPasswordHasher.Verify(request.Password, admin.PasswordHash))
        {
            await auditWriter.WriteAsync(
                null,
                "platform_admin.login_failed",
                "platform_admin",
                email,
                JsonSerializer.Serialize(new { email }),
                cancellationToken);
            return Results.Unauthorized();
        }

        await auditWriter.WriteAsync(
            new PlatformActor(admin.Id, admin.Email, admin.Role),
            "platform_admin.login_succeeded",
            "platform_admin",
            admin.Id.ToString(),
            JsonSerializer.Serialize(new { email = admin.Email, role = admin.Role.ToString().ToLowerInvariant() }),
            cancellationToken);

        return Results.Ok(new PlatformAdminProfileResponse(admin.Id, admin.Email, admin.Role, admin.CreatedAt));
    }
}
