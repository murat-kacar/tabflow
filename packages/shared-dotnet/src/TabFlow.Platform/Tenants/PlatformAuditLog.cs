namespace TabFlow.Platform.Tenants;

public sealed class PlatformAuditLog
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    public Guid? ActorAdminId { get; set; }

    public string ActorEmail { get; set; } = "";

    public string Action { get; set; } = "";

    public string EntityType { get; set; } = "";

    public string EntityId { get; set; } = "";

    public string PayloadJson { get; set; } = "{}";

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
