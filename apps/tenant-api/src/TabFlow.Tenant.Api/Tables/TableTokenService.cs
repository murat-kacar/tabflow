using System.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Options;
using TabFlow.Tenant.Api.Data;
using TabFlow.Tenant.Api.Orders;

namespace TabFlow.Tenant.Api.Tables;

public sealed class TableTokenService(IOptions<TenantRuntimeOptions> options)
{
    public async Task<DeviceTokenPayload> RotateAsync(
        TenantDbContext db,
        ServiceTable table,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var ttlSeconds = Math.Max(15, options.Value.DeviceTokenTtlSeconds);
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(7));
        var url = $"{options.Value.BaseUrl.TrimEnd('/')}/g/{rawToken}";
        var qr = QrMatrixEncoder.EncodeUrl(url);
        var tokenHash = Hash(rawToken.ToLowerInvariant());

        var activeTokens = await db.TableTokens
            .Where(token => token.TableId == table.Id && token.ConsumedAt == null && token.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.ConsumedAt = now;
        }

        db.TableTokens.Add(new TableToken
        {
            TableId = table.Id,
            TokenHash = tokenHash,
            ExpiresAt = now.AddSeconds(ttlSeconds)
        });

        await db.SaveChangesAsync(cancellationToken);

        return new DeviceTokenPayload(
            "new_token",
            table.Number,
            url,
            ttlSeconds,
            now.AddSeconds(ttlSeconds),
            qr.Side,
            qr.BitsHex);
    }

    public async Task<VerifiedTokenResult?> VerifyAsync(
        TenantDbContext db,
        string rawToken,
        CustomerSessionService sessionService,
        CancellationToken cancellationToken)
    {
        var normalized = rawToken.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var tokenHash = Hash(normalized);
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var tableId = await ConsumeTokenAsync(db, tokenHash, now, cancellationToken);

        if (tableId is null)
        {
            return null;
        }

        var table = await db.ServiceTables
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Id == tableId.Value && current.IsActive, cancellationToken);

        if (table is null)
        {
            return null;
        }

        var issuedSession = await sessionService.CreateAsync(db, table, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new VerifiedTokenResult(
            issuedSession.SessionId,
            issuedSession.SessionToken,
            table.Id,
            table.Number,
            table.Name,
            issuedSession.SessionExpiresAt);
    }

    private static async Task<Guid?> ConsumeTokenAsync(
        TenantDbContext db,
        string tokenHash,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE table_tokens
            SET consumed_at = @now
            WHERE token_hash = @token_hash
              AND consumed_at IS NULL
              AND expires_at > @now
              AND EXISTS (
                  SELECT 1
                  FROM service_tables
                  WHERE service_tables.id = table_tokens.table_id
                    AND service_tables.is_active
              )
            RETURNING table_id
            """;

        AddParameter(command, "@now", now);
        AddParameter(command, "@token_hash", tokenHash);

        if (db.Database.CurrentTransaction is not null)
        {
            command.Transaction = db.Database.CurrentTransaction.GetDbTransaction();
        }

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is Guid tableId ? tableId : null;
    }

    private static void AddParameter(IDbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private static string Hash(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

public sealed record DeviceTokenPayload(
    string Type,
    int TableNumber,
    string Url,
    int TtlSeconds,
    DateTimeOffset ExpiresAt,
    int QrSide,
    string QrBitsHex);

public sealed record VerifiedTokenResult(
    Guid SessionId,
    string SessionToken,
    Guid TableId,
    int TableNumber,
    string TableName,
    DateTimeOffset SessionExpiresAt);
