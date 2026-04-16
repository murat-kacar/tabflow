using Yenicafe.Platform.Tenants;

namespace Yenicafe.Platform.Api.Security;

[AttributeUsage(AttributeTargets.Method)]
public sealed class RequirePlatformRoleAttribute(params PlatformAdminRole[] roles) : Attribute
{
    public IReadOnlyList<PlatformAdminRole> Roles { get; } = roles;
}
