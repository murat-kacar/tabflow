namespace TabFlow.Platform.Tenants;

public sealed class ProvisioningOptions
{
    public bool EnableWorker { get; set; }

    public string OutputRoot { get; set; } = "runtime/generated";

    public int TenantBackendPortStart { get; set; } = 8100;

    public int TenantWebPortStart { get; set; } = 3100;

    public int InitialTableCount { get; set; } = 5;

    public int MaxAttempts { get; set; } = 5;

    public int RetryDelaySeconds { get; set; } = 60;

    public int LeaseSeconds { get; set; } = 300;

    public string WorkerId { get; set; } = string.Empty;
}
