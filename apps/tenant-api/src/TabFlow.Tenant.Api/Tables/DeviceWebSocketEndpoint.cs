using System.Net.WebSockets;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TabFlow.Tenant.Api.Data;

namespace TabFlow.Tenant.Api.Tables;

public static class DeviceWebSocketEndpoint
{
    public static async Task HandleAsync(HttpContext context)
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("WebSocket request expected.");
            return;
        }

        if (!int.TryParse(context.Request.RouteValues["tableNumber"]?.ToString(), out var tableNumber) || tableNumber <= 0)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        var db = context.RequestServices.GetRequiredService<TenantDbContext>();
        var runtime = context.RequestServices.GetRequiredService<IOptions<TenantRuntimeOptions>>().Value;
        var registry = context.RequestServices.GetRequiredService<DeviceConnectionRegistry>();
        var tokenService = context.RequestServices.GetRequiredService<TableTokenService>();
        var environment = context.RequestServices.GetRequiredService<IHostEnvironment>();
        var socket = await context.WebSockets.AcceptWebSocketAsync();
        var cancellationToken = context.RequestAborted;

        var table = await db.ServiceTables
            .Include(current => current.DeviceKeys.Where(key => key.IsActive))
            .FirstOrDefaultAsync(current => current.Number == tableNumber && current.IsActive, cancellationToken);

        if (table is null)
        {
            await socket.CloseAsync(WebSocketCloseStatus.PolicyViolation, "table_not_found", cancellationToken);
            return;
        }

        try
        {
            var queryKey = environment.IsDevelopment()
                ? context.Request.Query["anahtar"].ToString().Trim()
                : string.Empty;
            var rawKey = string.IsNullOrWhiteSpace(queryKey)
                ? await ReceiveAuthKeyAsync(socket, cancellationToken)
                : queryKey;

            var activeKey = table.DeviceKeys.OrderByDescending(key => key.CreatedAt).FirstOrDefault();
            if (activeKey is null || string.IsNullOrWhiteSpace(rawKey) || !DeviceKeyService.Verify(rawKey, activeKey.KeyHash))
            {
                await socket.CloseAsync(WebSocketCloseStatus.PolicyViolation, "unauthorized", cancellationToken);
                return;
            }

            activeKey.LastSeenAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);

            await registry.ConnectAsync(table.Id, socket, cancellationToken);
            await SendJsonAsync(socket, new
            {
                type = "auth_ok",
                table_number = table.Number,
                token_ttl_seconds = Math.Max(15, runtime.DeviceTokenTtlSeconds)
            }, cancellationToken);

            var initialToken = await tokenService.RotateAsync(db, table, cancellationToken);
            await registry.SendJsonAsync(table.Id, ToWirePayload(initialToken), cancellationToken);

            while (socket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
            {
                var message = await ReceiveTextAsync(socket, cancellationToken);
                if (message is null)
                {
                    break;
                }

                activeKey.LastSeenAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync(cancellationToken);

                if (string.Equals(message, "ping", StringComparison.OrdinalIgnoreCase))
                {
                    await SendTextAsync(socket, "pong", cancellationToken);
                    continue;
                }

                if (string.Equals(message, "refresh", StringComparison.OrdinalIgnoreCase))
                {
                    var payload = await tokenService.RotateAsync(db, table, cancellationToken);
                    await registry.SendJsonAsync(table.Id, ToWirePayload(payload), cancellationToken);
                }
            }
        }
        catch (WebSocketException)
        {
        }
        finally
        {
            registry.Disconnect(table.Id, socket);
        }
    }

    public static object ToWirePayload(DeviceTokenPayload payload) => new
    {
        type = payload.Type,
        table_number = payload.TableNumber,
        url = payload.Url,
        ttl_seconds = payload.TtlSeconds,
        expires_at = payload.ExpiresAt,
        qr_side = payload.QrSide,
        qr_bits_hex = payload.QrBitsHex
    };

    private static async Task<string> ReceiveAuthKeyAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var message = await ReceiveTextAsync(socket, cancellationToken);
        if (string.IsNullOrWhiteSpace(message))
        {
            return string.Empty;
        }

        try
        {
            var payload = JsonSerializer.Deserialize<DeviceAuthMessage>(message);
            return payload is not null && string.Equals(payload.Type, "auth", StringComparison.OrdinalIgnoreCase)
                ? payload.DeviceKey?.Trim() ?? string.Empty
                : string.Empty;
        }
        catch (JsonException)
        {
            return string.Empty;
        }
    }

    private static async Task<string?> ReceiveTextAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var buffer = new byte[4096];
        using var stream = new MemoryStream();

        while (true)
        {
            var result = await socket.ReceiveAsync(buffer, cancellationToken);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                return null;
            }

            stream.Write(buffer, 0, result.Count);
            if (result.EndOfMessage)
            {
                return System.Text.Encoding.UTF8.GetString(stream.ToArray());
            }
        }
    }

    private static Task SendTextAsync(WebSocket socket, string payload, CancellationToken cancellationToken) =>
        socket.SendAsync(System.Text.Encoding.UTF8.GetBytes(payload), WebSocketMessageType.Text, true, cancellationToken);

    private static Task SendJsonAsync(WebSocket socket, object payload, CancellationToken cancellationToken) =>
        socket.SendAsync(JsonSerializer.SerializeToUtf8Bytes(payload), WebSocketMessageType.Text, true, cancellationToken);

    private sealed record DeviceAuthMessage(string Type, string? DeviceKey);
}
