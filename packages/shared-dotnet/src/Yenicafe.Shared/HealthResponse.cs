namespace Yenicafe.BuildingBlocks;

public sealed record HealthResponse(
    string Status,
    string Service,
    DateTimeOffset Time,
    string Environment);
