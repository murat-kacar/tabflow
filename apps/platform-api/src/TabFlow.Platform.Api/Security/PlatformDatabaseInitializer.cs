using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TabFlow.Platform.Data;
using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Api.Security;

public static class PlatformDatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        await db.Database.OpenConnectionAsync(cancellationToken);

        try
        {
            await EnsureSchemaAsync(db, cancellationToken);
            await EnsureBootstrapAdminAsync(db, configuration, cancellationToken);
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    private static async Task EnsureSchemaAsync(PlatformDbContext db, CancellationToken cancellationToken)
    {
        var assembly = Assembly.GetExecutingAssembly();
        await using var stream = assembly.GetManifestResourceStream("PlatformSchema.sql")
            ?? throw new InvalidOperationException("Embedded platform schema not found.");
        using var reader = new StreamReader(stream);
        var sql = await reader.ReadToEndAsync(cancellationToken);

        var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = sql;

        if (db.Database.CurrentTransaction is not null)
        {
            command.Transaction = db.Database.CurrentTransaction.GetDbTransaction();
        }

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task EnsureBootstrapAdminAsync(
        PlatformDbContext db,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        if (await db.PlatformAdmins.AnyAsync(cancellationToken))
        {
            return;
        }

        var email = configuration["PlatformAdmin:BootstrapEmail"]?.Trim().ToLowerInvariant();
        var password = configuration["PlatformAdmin:BootstrapPassword"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            INSERT INTO platform_admins (id, email, password_hash, role, language_code, is_active, created_at)
            VALUES (@id, @email, @password_hash, 'owner'::platform_admin_role, 'en', TRUE, now())
            """;

        var idParameter = command.CreateParameter();
        idParameter.ParameterName = "@id";
        idParameter.Value = Guid.NewGuid();
        command.Parameters.Add(idParameter);

        var emailParameter = command.CreateParameter();
        emailParameter.ParameterName = "@email";
        emailParameter.Value = email;
        command.Parameters.Add(emailParameter);

        var passwordParameter = command.CreateParameter();
        passwordParameter.ParameterName = "@password_hash";
        passwordParameter.Value = PlatformPasswordHasher.Hash(password);
        command.Parameters.Add(passwordParameter);

        if (db.Database.CurrentTransaction is not null)
        {
            command.Transaction = db.Database.CurrentTransaction.GetDbTransaction();
        }

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
