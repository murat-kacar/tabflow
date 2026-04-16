using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace TabFlow.Tenant.Api.Data;

public static class TenantDatabaseLocks
{
    public static Task AcquireTransactionLockAsync(
        TenantDbContext db,
        string lockKey,
        CancellationToken cancellationToken) =>
        ExecuteScalarAsync(
            db,
            "SELECT pg_advisory_xact_lock(hashtextextended(@lock_key, 0));",
            ("@lock_key", lockKey),
            cancellationToken);

    private static async Task ExecuteScalarAsync(
        TenantDbContext db,
        string commandText,
        (string Name, object Value) parameter,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
        {
            await db.Database.OpenConnectionAsync(cancellationToken);
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = commandText;
            AddParameter(command, parameter.Name, parameter.Value);

            if (db.Database.CurrentTransaction is not null)
            {
                command.Transaction = db.Database.CurrentTransaction.GetDbTransaction();
            }

            await command.ExecuteScalarAsync(cancellationToken);
        }
        finally
        {
            if (shouldClose)
            {
                await db.Database.CloseConnectionAsync();
            }
        }
    }

    private static void AddParameter(IDbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
