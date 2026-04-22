using Microsoft.EntityFrameworkCore;
using TabFlow.Tenant.Api.Data;

namespace TabFlow.Tenant.Api.Auth;

public sealed class TenantAdminActorEndpointFilter(TenantDbContext db) : IEndpointFilter
{
    private const string HeaderAdminId = "X-Tenant-Admin-Id";
    private const string HeaderEmail = "X-Tenant-Admin-Email";

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        if (!Guid.TryParse(context.HttpContext.Request.Headers[HeaderAdminId], out var adminId))
        {
            return Results.Unauthorized();
        }

        var email = context.HttpContext.Request.Headers[HeaderEmail].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            return Results.Unauthorized();
        }

        var admin = await db.TenantAdmins
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Id == adminId && current.Email == email && current.IsActive);

        if (admin is null)
        {
            return Results.Unauthorized();
        }

        context.HttpContext.Items[typeof(TenantAdminActor)] = new TenantAdminActor(admin.Id, admin.Email);

        return await next(context);
    }
}
