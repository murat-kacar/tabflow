using System.Security.Cryptography;
using System.Text;

namespace TabFlow.Tenant.Api.Tables;

public static class DeviceKeyService
{
    public static string GenerateRawKey(int tableNumber) =>
        $"{Convert.ToHexString(RandomNumberGenerator.GetBytes(12)).ToLowerInvariant()}-masa{tableNumber:000}";

    public static string Hash(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static string CreateHint(string rawKey) =>
        rawKey.Length <= 16 ? rawKey : rawKey[^16..];

    public static bool Verify(string rawKey, string expectedHash)
    {
        var actual = Hash(rawKey);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(actual),
            Encoding.UTF8.GetBytes(expectedHash));
    }
}
