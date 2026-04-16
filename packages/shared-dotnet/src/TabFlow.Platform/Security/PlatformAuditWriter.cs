using TabFlow.Platform.Data;
using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Security;

public sealed class PlatformAuditWriter(PlatformDbContext db)
{
    public async Task WriteAsync(
        PlatformActor? actor,
        string action,
        string entityType,
        string entityId,
        string payloadJson,
        CancellationToken cancellationToken)
    {
        db.AuditLogs.Add(new PlatformAuditLog
        {
            ActorAdminId = actor?.AdminId,
            ActorEmail = actor?.Email ?? "system",
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            PayloadJson = payloadJson
        });

        await db.SaveChangesAsync(cancellationToken);
    }
}
