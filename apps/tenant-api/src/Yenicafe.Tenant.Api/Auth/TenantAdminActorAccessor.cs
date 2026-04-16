namespace Yenicafe.Tenant.Api.Auth;

public static class TenantAdminActorAccessor
{
    public static TenantAdminActor? Read(HttpContext context)
    {
        if (context.Items.TryGetValue(typeof(TenantAdminActor), out var value) && value is TenantAdminActor actor)
        {
            return actor;
        }

        return null;
    }
}
