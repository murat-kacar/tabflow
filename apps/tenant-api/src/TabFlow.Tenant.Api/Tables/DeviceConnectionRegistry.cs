using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text.Json;

namespace TabFlow.Tenant.Api.Tables;

public sealed class DeviceConnectionRegistry
{
    private readonly ConcurrentDictionary<Guid, DeviceConnectionState> _connections = new();

    public bool IsOnline(Guid tableId) => _connections.ContainsKey(tableId);

    public async Task ConnectAsync(Guid tableId, WebSocket socket, CancellationToken cancellationToken)
    {
        if (_connections.TryGetValue(tableId, out var previous) && previous.Socket != socket)
        {
            try
            {
                await previous.Socket.CloseAsync(
                    WebSocketCloseStatus.NormalClosure,
                    "replaced",
                    cancellationToken);
            }
            catch
            {
            }
        }

        _connections[tableId] = new DeviceConnectionState(socket);
    }

    public void Disconnect(Guid tableId, WebSocket? socket = null)
    {
        if (!_connections.TryGetValue(tableId, out var current))
        {
            return;
        }

        if (socket is not null && current.Socket != socket)
        {
            return;
        }

        _connections.TryRemove(tableId, out _);
    }

    public async Task SendJsonAsync(Guid tableId, object payload, CancellationToken cancellationToken)
    {
        if (!_connections.TryGetValue(tableId, out var connection))
        {
            return;
        }

        try
        {
            await connection.Socket.SendAsync(
                JsonSerializer.SerializeToUtf8Bytes(payload),
                WebSocketMessageType.Text,
                true,
                cancellationToken);
        }
        catch
        {
            Disconnect(tableId, connection.Socket);
        }
    }

    public async Task CloseAsync(Guid tableId, WebSocketCloseStatus closeStatus, string statusDescription, CancellationToken cancellationToken)
    {
        if (!_connections.TryRemove(tableId, out var connection))
        {
            return;
        }

        try
        {
            await connection.Socket.CloseAsync(closeStatus, statusDescription, cancellationToken);
        }
        catch
        {
        }
    }

    private sealed record DeviceConnectionState(WebSocket Socket);
}
