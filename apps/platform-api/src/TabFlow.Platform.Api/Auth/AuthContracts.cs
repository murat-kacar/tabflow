using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Api.Auth;

public sealed record LoginRequest(string Email, string Password);

public sealed record PlatformAdminProfileResponse(
    Guid Id,
    string Email,
    PlatformAdminRole Role,
    string LanguageCode,
    DateTimeOffset CreatedAt);

public sealed record UpdatePlatformAdminPreferenceRequest(string LanguageCode);

public sealed record BootstrapStatusResponse(bool BootstrapRequired);
