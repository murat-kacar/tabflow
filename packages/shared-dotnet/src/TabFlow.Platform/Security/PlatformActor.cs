using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Security;

public sealed record PlatformActor(Guid? AdminId, string Email, PlatformAdminRole Role);
