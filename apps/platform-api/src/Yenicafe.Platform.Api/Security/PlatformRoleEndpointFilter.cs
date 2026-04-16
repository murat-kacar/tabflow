using Yenicafe.Platform.Security;
using Yenicafe.Platform.Tenants;

namespace Yenicafe.Platform.Api.Security;

public sealed class PlatformRoleEndpointFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var required = context.HttpContext.GetEndpoint()?.Metadata.GetMetadata<RequirePlatformRoleAttribute>();

        if (required is null || required.Roles.Count == 0)
        {
            return await next(context);
        }

        var actor = PlatformActorAccessor.Read(context.HttpContext);

        if (actor is null)
        {
            return Results.Unauthorized();
        }

        if (!required.Roles.Contains(actor.Role))
        {
            return Results.Forbid();
        }

        return await next(context);
    }
}
