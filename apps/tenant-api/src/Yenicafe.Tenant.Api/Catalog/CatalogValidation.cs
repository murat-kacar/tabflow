using System.Text.RegularExpressions;

namespace Yenicafe.Tenant.Api.Catalog;

public static partial class CatalogValidation
{
    [GeneratedRegex("^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$", RegexOptions.CultureInvariant)]
    private static partial Regex TenantCodeRegex();

    [GeneratedRegex("^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$", RegexOptions.CultureInvariant)]
    private static partial Regex HostRegex();

    public static string NormalizeCode(string value) => value.Trim().ToLowerInvariant();

    public static string NormalizeHost(string value)
    {
        var trimmed = value.Trim().ToLowerInvariant();

        if (trimmed.StartsWith("https://", StringComparison.Ordinal))
        {
            trimmed = trimmed["https://".Length..];
        }
        else if (trimmed.StartsWith("http://", StringComparison.Ordinal))
        {
            trimmed = trimmed["http://".Length..];
        }

        return trimmed.TrimEnd('/');
    }

    public static string NormalizeCurrency(string value) => value.Trim().ToUpperInvariant();

    public static string NormalizeSlug(string value)
    {
        var slug = value.Trim().ToLowerInvariant().Replace(' ', '-');

        return Regex.Replace(slug, "[^a-z0-9-]", string.Empty);
    }

    public static bool IsValidTenantCode(string value) => TenantCodeRegex().IsMatch(value);

    public static bool IsValidHost(string value) => HostRegex().IsMatch(value);

    public static bool IsValidSlug(string value) => !string.IsNullOrWhiteSpace(value) && value == NormalizeSlug(value);
}
