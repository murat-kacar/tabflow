using Yenicafe.Platform.Tenants;

namespace Yenicafe.Platform.Security;

public sealed record PlatformActor(Guid? AdminId, string Email, PlatformAdminRole Role);
