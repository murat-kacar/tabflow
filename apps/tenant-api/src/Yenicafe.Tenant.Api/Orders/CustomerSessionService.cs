using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Yenicafe.Tenant.Api.Data;
using Yenicafe.Tenant.Api.Tables;

namespace Yenicafe.Tenant.Api.Orders;

public sealed class CustomerSessionService(IOptions<TenantRuntimeOptions> options)
{
    public async Task<IssuedCustomerSession> CreateAsync(
        TenantDbContext db,
        ServiceTable table,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24))
            .Replace("+", "A", StringComparison.Ordinal)
            .Replace("/", "B", StringComparison.Ordinal)
            .TrimEnd('=');

        var session = new CustomerSession
        {
            TableId = table.Id,
            SessionTokenHash = Hash(rawToken),
            ExpiresAt = now.AddMinutes(Math.Max(15, options.Value.CustomerSessionTtlMinutes))
        };

        db.CustomerSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);

        return new IssuedCustomerSession(session.Id, rawToken, session.ExpiresAt, session.OpenedAt, session.LastSeenAt);
    }

    public async Task<ActiveCustomerSession?> ValidateAsync(
        TenantDbContext db,
        string rawToken,
        CancellationToken cancellationToken)
    {
        var token = rawToken.Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var session = await db.CustomerSessions
            .Include(current => current.Table)
            .FirstOrDefaultAsync(current => current.SessionTokenHash == Hash(token), cancellationToken);

        if (session is null || session.ClosedAt is not null || session.ExpiresAt <= now || session.Table is null || !session.Table.IsActive)
        {
            return null;
        }

        session.LastSeenAt = now;
        await db.SaveChangesAsync(cancellationToken);

        return new ActiveCustomerSession(
            session.Id,
            session.TableId,
            session.Table.Number,
            session.Table.Name,
            session.OpenedAt,
            session.ExpiresAt,
            session.LastSeenAt);
    }

    public async Task<bool> CloseAsync(TenantDbContext db, string rawToken, CancellationToken cancellationToken)
    {
        var token = rawToken.Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var session = await db.CustomerSessions
            .FirstOrDefaultAsync(current => current.SessionTokenHash == Hash(token), cancellationToken);

        if (session is null || session.ClosedAt is not null)
        {
            return false;
        }

        session.ClosedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string Hash(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

public sealed record IssuedCustomerSession(
    Guid SessionId,
    string SessionToken,
    DateTimeOffset SessionExpiresAt,
    DateTimeOffset OpenedAt,
    DateTimeOffset LastSeenAt);

public sealed record ActiveCustomerSession(
    Guid SessionId,
    Guid TableId,
    int TableNumber,
    string TableName,
    DateTimeOffset OpenedAt,
    DateTimeOffset ExpiresAt,
    DateTimeOffset LastSeenAt);
