using System.Collections;
using QRCoder;

namespace Yenicafe.Tenant.Api.Tables;

public static class QrMatrixEncoder
{
    public static QrMatrixPayload EncodeUrl(string url)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(
            plainText: url,
            eccLevel: QRCodeGenerator.ECCLevel.L,
            forceUtf8: true,
            utf8BOM: false,
            eciMode: QRCodeGenerator.EciMode.Utf8,
            requestedVersion: -1);

        var matrix = TrimQuietZone(data.ModuleMatrix);
        return new QrMatrixPayload(matrix.Count, PackBitsHex(matrix));
    }

    private static List<BitArray> TrimQuietZone(List<BitArray> source)
    {
        if (source.Count == 0)
        {
            throw new InvalidOperationException("QR matrix was empty.");
        }

        var top = 0;
        var bottom = source.Count - 1;
        while (top <= bottom && IsWhiteRow(source[top]))
        {
            top++;
        }

        while (bottom >= top && IsWhiteRow(source[bottom]))
        {
            bottom--;
        }

        if (top > bottom)
        {
            throw new InvalidOperationException("QR matrix did not contain drawable modules.");
        }

        var left = 0;
        var right = source[top].Length - 1;
        while (left <= right && IsWhiteColumn(source, left, top, bottom))
        {
            left++;
        }

        while (right >= left && IsWhiteColumn(source, right, top, bottom))
        {
            right--;
        }

        var trimmed = new List<BitArray>(bottom - top + 1);
        for (var y = top; y <= bottom; y++)
        {
            var row = new BitArray(right - left + 1);
            for (var x = left; x <= right; x++)
            {
                row[x - left] = source[y][x];
            }

            trimmed.Add(row);
        }

        return trimmed;
    }

    private static bool IsWhiteRow(BitArray row)
    {
        for (var index = 0; index < row.Length; index++)
        {
            if (row[index])
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsWhiteColumn(List<BitArray> matrix, int column, int top, int bottom)
    {
        for (var row = top; row <= bottom; row++)
        {
            if (matrix[row][column])
            {
                return false;
            }
        }

        return true;
    }

    private static string PackBitsHex(List<BitArray> matrix)
    {
        var side = matrix.Count;
        var bitCount = side * side;
        var byteCount = (bitCount + 7) / 8;
        var bytes = new byte[byteCount];

        var bitIndex = 0;
        for (var y = 0; y < side; y++)
        {
            var row = matrix[y];
            for (var x = 0; x < side; x++)
            {
                if (row[x])
                {
                    bytes[bitIndex / 8] |= (byte)(0x80 >> (bitIndex % 8));
                }

                bitIndex++;
            }
        }

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

public sealed record QrMatrixPayload(int Side, string BitsHex);
