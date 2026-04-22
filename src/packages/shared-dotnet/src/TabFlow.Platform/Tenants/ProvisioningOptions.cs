namespace TabFlow.Platform.Tenants;

public sealed class ProvisioningOptions
{
    public bool EnableWorker { get; set; }

    public string OutputRoot { get; set; } = "runtime/generated";

    public string TenantApiDeployRoot { get; set; } = "/opt/tabflow-deploy/tenant-api";

    public string TenantWebRoot { get; set; } = "/opt/tabflow/src/apps/tenant-web";

    public string TenantEnvRoot { get; set; } = "/etc/tabflow/tenants";

    public string NginxSitesAvailableRoot { get; set; } = "/etc/nginx/sites-available";

    public string NginxSitesEnabledRoot { get; set; } = "/etc/nginx/sites-enabled";

    public int TenantBackendPortStart { get; set; } = 8100;

    public int TenantWebPortStart { get; set; } = 3100;

    public int InitialTableCount { get; set; } = 5;

    public int MaxAttempts { get; set; } = 5;

    public int RetryDelaySeconds { get; set; } = 60;

    public int LeaseSeconds { get; set; } = 300;

    public string WorkerId { get; set; } = string.Empty;

    public string TenantDatabaseOwner { get; set; } = string.Empty;

    public string TenantDatabasePassword { get; set; } = string.Empty;

    public string CertbotEmail { get; set; } = string.Empty;

    public string CertbotBinary { get; set; } = "certbot";

    public string SystemctlBinary { get; set; } = "systemctl";

    public string NginxBinary { get; set; } = "nginx";

    public string DotnetBinary { get; set; } = "/usr/bin/dotnet";

    public string NodeBinary { get; set; } = "/usr/local/bin/node";

    public int HealthCheckTimeoutSeconds { get; set; } = 15;
}
