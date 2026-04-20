namespace TabFlow.Platform.Tenants;

public sealed class PlatformAdmin
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    public required string Email { get; set; }

    public required string PasswordHash { get; set; }

    public PlatformAdminRole Role { get; set; } = PlatformAdminRole.Admin;

    public string LanguageCode { get; set; } = "en";

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
