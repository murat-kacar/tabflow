using TabFlow.Tenant.Api.Orders;

namespace TabFlow.Tenant.Api;

public sealed record TenantProfileResponse(
    Guid Id,
    string Code,
    string DisplayName,
    string PrimaryDomain,
    string CurrencyCode);

public sealed record ServiceTableResponse(Guid Id, int Number, string Name);

public sealed record AdminTableSummaryResponse(
    Guid Id,
    int Number,
    string Name,
    string ServiceNote,
    bool IsActive,
    bool DeviceOnline,
    int ActiveSessionCount,
    int SubmittedOrderCount,
    int PreparingOrderCount,
    int ReadyOrderCount,
    Guid? OpenBillId,
    int OpenBillSubtotalMinor,
    string? OpenBillCurrencyCode,
    DateTimeOffset UpdatedAt);

public sealed record DeviceKeySummaryResponse(
    Guid Id,
    string KeyHint,
    bool IsActive,
    DateTimeOffset? LastSeenAt,
    DateTimeOffset CreatedAt);

public sealed record AdminDeviceResponse(
    Guid TableId,
    int TableNumber,
    string TableName,
    bool TableIsActive,
    bool DeviceOnline,
    DeviceKeySummaryResponse? ActiveKey,
    DeviceTokenSummaryResponse? ActiveToken);

public sealed record DeviceTokenSummaryResponse(
    string Url,
    int TtlSeconds,
    DateTimeOffset ExpiresAt);

public sealed record RotateDeviceKeyResponse(
    AdminDeviceResponse Device,
    string RawDeviceKey,
    string FirmwareConfig);

public sealed record UpsertServiceTableRequest(
    int Number,
    string Name,
    string ServiceNote,
    bool IsActive);

public sealed record ServiceStationResponse(
    Guid Id,
    string Code,
    string Name,
    string ColorHex,
    int SortOrder,
    bool IsActive);

public sealed record UpsertServiceStationRequest(
    string Code,
    string Name,
    string ColorHex,
    int SortOrder,
    bool IsActive);

public sealed record MenuCategoryResponse(
    Guid Id,
    string Slug,
    string Name,
    Guid? StationId,
    string? StationName,
    int SortOrder,
    IReadOnlyList<MenuItemResponse> Items);

public sealed record MenuItemResponse(
    Guid Id,
    string Sku,
    string Name,
    string Description,
    int PriceMinor,
    string CurrencyCode,
    int SortOrder);

public sealed record CatalogResponse(
    TenantProfileResponse Tenant,
    IReadOnlyList<MenuCategoryResponse> Categories);

public sealed record TenantAdminBootstrapStatusResponse(bool BootstrapRequired, string? SuggestedAdminEmail);

public sealed record TenantAdminProfileResponse(
    Guid Id,
    string Email,
    DateTimeOffset CreatedAt,
    bool MustChangePassword);

public sealed record BootstrapTenantAdminRequest(string Email, string Password);

public sealed record TenantAdminLoginRequest(string Email, string Password);

public sealed record TenantAdminSessionResponse(
    Guid Id,
    string Email,
    DateTimeOffset CreatedAt,
    DateTimeOffset IssuedAt,
    bool MustChangePassword);

public sealed record ChangeTenantAdminPasswordRequest(string CurrentPassword, string NewPassword);

public sealed record CustomerOrderSummaryResponse(
    Guid Id,
    Guid? BillId,
    Guid? TableId,
    int? TableNumber,
    string? TableName,
    CustomerOrderStatus Status,
    IReadOnlyList<CustomerOrderStatus> AllowedNextStatuses,
    string Note,
    int SubtotalMinor,
    string CurrencyCode,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<CustomerOrderItemResponse> Items);

public sealed record CustomerBillSummaryResponse(
    Guid Id,
    Guid TableId,
    int TableNumber,
    string TableName,
    CustomerBillStatus Status,
    int OrderCount,
    int SubtotalMinor,
    string CurrencyCode,
    DateTimeOffset OpenedAt,
    DateTimeOffset? ClosedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateCustomerOrderItemRequest(Guid MenuItemId, int Quantity, string Note);

public sealed record CreateCustomerOrderRequest(
    string Note,
    IReadOnlyList<CreateCustomerOrderItemRequest> Items);

public sealed record UpdateCustomerOrderStatusRequest(CustomerOrderStatus Status);

public sealed record VerifyTableTokenRequest(string Token);

public sealed record VerifiedCustomerSessionResponse(
    Guid SessionId,
    string SessionToken,
    Guid TableId,
    int TableNumber,
    string TableName,
    string TenantCode,
    string TenantDisplayName,
    string TenantPrimaryDomain,
    DateTimeOffset SessionExpiresAt);

public sealed record CustomerSessionStatusResponse(
    Guid SessionId,
    Guid TableId,
    int TableNumber,
    string TableName,
    DateTimeOffset OpenedAt,
    DateTimeOffset ExpiresAt,
    DateTimeOffset LastSeenAt);

public sealed record UpsertMenuCategoryRequest(
    string Slug,
    string Name,
    Guid? StationId,
    int SortOrder,
    bool IsActive);

public sealed record UpsertMenuItemRequest(
    Guid CategoryId,
    string Sku,
    string Name,
    string Description,
    int PriceMinor,
    string CurrencyCode,
    int SortOrder,
    bool IsAvailable);

public sealed record CustomerOrderItemResponse(
    Guid Id,
    Guid MenuItemId,
    string ItemName,
    CustomerOrderStatus Status,
    int Quantity,
    int UnitPriceMinor,
    int LineTotalMinor,
    string Note);

public sealed record CustomerOrderDetailResponse(
    Guid Id,
    Guid? BillId,
    Guid? TableId,
    int? TableNumber,
    string? TableName,
    CustomerOrderStatus Status,
    string Note,
    int SubtotalMinor,
    string CurrencyCode,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<CustomerOrderItemResponse> Items);

public sealed record KitchenTicketItemResponse(
    Guid OrderItemId,
    Guid OrderId,
    CustomerOrderStatus OrderStatus,
    CustomerOrderStatus ItemStatus,
    Guid? TableId,
    int? TableNumber,
    string? TableName,
    Guid MenuItemId,
    string ItemName,
    int Quantity,
    string ItemNote,
    string OrderNote,
    DateTimeOffset CreatedAt);

public sealed record KitchenStationBoardResponse(
    Guid? StationId,
    string StationCode,
    string StationName,
    string ColorHex,
    IReadOnlyList<KitchenTicketItemResponse> Items);
