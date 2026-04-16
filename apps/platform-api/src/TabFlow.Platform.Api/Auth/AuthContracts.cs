using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Api.Auth;

public sealed record LoginRequest(string Email, string Password);

public sealed record PlatformAdminProfileResponse(Guid Id, string Email, PlatformAdminRole Role, DateTimeOffset CreatedAt);

public sealed record BootstrapStatusResponse(bool BootstrapRequired);
