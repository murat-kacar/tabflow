using System.Text.RegularExpressions;

namespace TabFlow.Platform.Api.Tenants;

public static partial class TenantValidation
{
    public static string NormalizeCode(string code) => code.Trim().ToLowerInvariant();

    public static string NormalizeHost(string host) => host.Trim().TrimEnd('.').ToLowerInvariant();

    public static bool IsValidCode(string code) => TenantCodeRegex().IsMatch(code);

    public static bool IsValidHost(string host) => DomainRegex().IsMatch(host);

    [GeneratedRegex("^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$")]
    private static partial Regex TenantCodeRegex();

    [GeneratedRegex("^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$")]
    private static partial Regex DomainRegex();
}
