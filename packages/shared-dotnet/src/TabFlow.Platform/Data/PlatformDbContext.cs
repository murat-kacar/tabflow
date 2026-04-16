using Microsoft.EntityFrameworkCore;
using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Data;

public sealed class PlatformDbContext(DbContextOptions<PlatformDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<TenantDomain> TenantDomains => Set<TenantDomain>();

    public DbSet<PlatformAdmin> PlatformAdmins => Set<PlatformAdmin>();

    public DbSet<ProvisionJob> ProvisionJobs => Set<ProvisionJob>();

    public DbSet<PlatformAuditLog> AuditLogs => Set<PlatformAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresEnum<TenantStatus>("tenant_status");
        modelBuilder.HasPostgresEnum<ProvisionJobStatus>("provision_job_status");
        modelBuilder.HasPostgresEnum<PlatformAdminRole>("platform_admin_role");

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("platform_tenants");
            entity.HasKey(tenant => tenant.Id);
            entity.Property(tenant => tenant.Id).HasColumnName("id");
            entity.HasIndex(tenant => tenant.Code).IsUnique();
            entity.Property(tenant => tenant.Code).HasColumnName("code").HasMaxLength(63);
            entity.Property(tenant => tenant.DisplayName).HasColumnName("display_name").HasMaxLength(160);
            entity.Property(tenant => tenant.InitialAdminEmail).HasColumnName("initial_admin_email").HasMaxLength(254);
            entity.Property(tenant => tenant.Status).HasColumnName("status").HasColumnType("tenant_status");
            entity.Property(tenant => tenant.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(tenant => tenant.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<TenantDomain>(entity =>
        {
            entity.ToTable("platform_tenant_domains");
            entity.HasKey(domain => domain.Id);
            entity.Property(domain => domain.Id).HasColumnName("id");
            entity.HasIndex(domain => domain.Host).IsUnique();
            entity.Property(domain => domain.TenantId).HasColumnName("tenant_id");
            entity.Property(domain => domain.Host).HasColumnName("host").HasMaxLength(253);
            entity.Property(domain => domain.IsPrimary).HasColumnName("is_primary");
            entity.Property(domain => domain.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.HasOne(domain => domain.Tenant)
                .WithMany(tenant => tenant.Domains)
                .HasForeignKey(domain => domain.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlatformAdmin>(entity =>
        {
            entity.ToTable("platform_admins");
            entity.HasKey(admin => admin.Id);
            entity.Property(admin => admin.Id).HasColumnName("id");
            entity.HasIndex(admin => admin.Email).IsUnique();
            entity.Property(admin => admin.Email).HasColumnName("email").HasMaxLength(254);
            entity.Property(admin => admin.PasswordHash).HasColumnName("password_hash").HasMaxLength(512);
            entity.Property(admin => admin.Role).HasColumnName("role").HasColumnType("platform_admin_role");
            entity.Property(admin => admin.IsActive).HasColumnName("is_active");
            entity.Property(admin => admin.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<ProvisionJob>(entity =>
        {
            entity.ToTable("platform_provision_jobs");
            entity.HasKey(job => job.Id);
            entity.Property(job => job.Id).HasColumnName("id");
            entity.Property(job => job.TenantId).HasColumnName("tenant_id");
            entity.Property(job => job.Type).HasColumnName("type").HasMaxLength(80);
            entity.Property(job => job.Status).HasColumnName("status").HasColumnType("provision_job_status");
            entity.Property(job => job.AttemptCount).HasColumnName("attempt_count");
            entity.Property(job => job.WorkerId).HasColumnName("worker_id").HasMaxLength(160);
            entity.Property(job => job.LeaseUntil).HasColumnName("lease_until");
            entity.Property(job => job.NextAttemptAt).HasColumnName("next_attempt_at");
            entity.Property(job => job.CurrentStep).HasColumnName("current_step").HasMaxLength(120);
            entity.Property(job => job.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb");
            entity.Property(job => job.ResultJson).HasColumnName("result_json").HasColumnType("jsonb");
            entity.Property(job => job.ErrorMessage).HasColumnName("error_message").HasMaxLength(2000);
            entity.Property(job => job.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(job => job.StartedAt).HasColumnName("started_at");
            entity.Property(job => job.CompletedAt).HasColumnName("completed_at");
            entity.Property(job => job.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasOne(job => job.Tenant)
                .WithMany(tenant => tenant.ProvisionJobs)
                .HasForeignKey(job => job.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlatformAuditLog>(entity =>
        {
            entity.ToTable("platform_audit_logs");
            entity.HasKey(log => log.Id);
            entity.Property(log => log.Id).HasColumnName("id");
            entity.Property(log => log.ActorAdminId).HasColumnName("actor_admin_id");
            entity.Property(log => log.ActorEmail).HasColumnName("actor_email").HasMaxLength(254);
            entity.Property(log => log.Action).HasColumnName("action").HasMaxLength(120);
            entity.Property(log => log.EntityType).HasColumnName("entity_type").HasMaxLength(120);
            entity.Property(log => log.EntityId).HasColumnName("entity_id").HasMaxLength(120);
            entity.Property(log => log.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb");
            entity.Property(log => log.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        });
    }
}
