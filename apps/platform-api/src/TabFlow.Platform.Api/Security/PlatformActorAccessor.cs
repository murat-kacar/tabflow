using System.Security.Claims;
using TabFlow.Platform.Security;
using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Api.Security;

public static class PlatformActorAccessor
{
    public static PlatformActor? Read(HttpContext context)
    {
        if (context.Items.TryGetValue(typeof(PlatformActor), out var value) && value is PlatformActor actor)
        {
            return actor;
        }

        var principal = context.User;

        if (principal.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        Guid? adminId = Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedId)
            ? parsedId
            : null;
        var email = principal.FindFirstValue(ClaimTypes.Email) ?? "";
        var role = Enum.TryParse<PlatformAdminRole>(
            principal.FindFirstValue(ClaimTypes.Role),
            ignoreCase: true,
            out var parsedRole)
            ? parsedRole
            : PlatformAdminRole.Viewer;

        return new PlatformActor(adminId, email, role);
    }
}
