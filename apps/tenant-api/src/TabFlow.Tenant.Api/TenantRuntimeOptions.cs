namespace TabFlow.Tenant.Api;

public sealed class TenantRuntimeOptions
{
    public const string DefaultAdminPassword = "TabFlow123.";

    public string Code { get; set; } = "demo";

    public string DisplayName { get; set; } = "Demo Cafe";

    public string BaseUrl { get; set; } = "https://demo.example.com";

    public string InitialAdminEmail { get; set; } = string.Empty;

    public string BootstrapToken { get; set; } = string.Empty;

    public string CurrencyCode { get; set; } = "GBP";

    public int InitialTableCount { get; set; } = 5;

    public int DeviceTokenTtlSeconds { get; set; } = 60;

    public string DeviceKeySeedJson { get; set; } = string.Empty;

    public int CustomerSessionTtlMinutes { get; set; } = 120;
}
