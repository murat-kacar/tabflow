using Microsoft.EntityFrameworkCore;
using TabFlow.Platform.Data;
using TabFlow.Platform.Security;
using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Api.Security;

public sealed class PlatformActorEndpointFilter(PlatformDbContext db) : IEndpointFilter
{
    private const string HeaderId = "X-Platform-Actor-Id";
    private const string HeaderEmail = "X-Platform-Actor-Email";
    private const string HeaderRole = "X-Platform-Actor-Role";

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var idHeader = context.HttpContext.Request.Headers[HeaderId].ToString();
        var email = context.HttpContext.Request.Headers[HeaderEmail].ToString().Trim().ToLowerInvariant();
        var roleHeader = context.HttpContext.Request.Headers[HeaderRole].ToString();

        if (string.IsNullOrWhiteSpace(email)
            || !Guid.TryParse(idHeader, out var providedId)
            || !Enum.TryParse<PlatformAdminRole>(roleHeader, true, out var providedRole))
        {
            return Results.Problem("Platform actor metadata is missing.", statusCode: StatusCodes.Status401Unauthorized);
        }

        var admin = await db.PlatformAdmins
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Email == email && current.IsActive, context.HttpContext.RequestAborted);

        if (admin is null)
        {
            return Results.Unauthorized();
        }

        if (providedId != admin.Id || providedRole != admin.Role)
        {
            return Results.Unauthorized();
        }

        context.HttpContext.Items[typeof(PlatformActor)] = new PlatformActor(admin.Id, admin.Email, admin.Role);

        return await next(context);
    }
}
