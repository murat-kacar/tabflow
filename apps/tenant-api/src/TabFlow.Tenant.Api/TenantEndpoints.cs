using TabFlow.Tenant.Api.Auth;
using System.Security.Cryptography;
using System.Text;
using System.Net.WebSockets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TabFlow.Tenant.Api.Catalog;
using TabFlow.Tenant.Api.Data;
using TabFlow.Tenant.Api.Kitchen;
using TabFlow.Tenant.Api.Orders;
using TabFlow.Tenant.Api.Tables;

namespace TabFlow.Tenant.Api;

public static class TenantEndpoints
{
    public static IEndpointRouteBuilder MapTenantEndpoints(this IEndpointRouteBuilder routes)
    {
        var adminGroup = routes
            .MapGroup("/api/admin")
            .AddEndpointFilter<TenantAdminApiKeyEndpointFilter>()
            .AddEndpointFilter<TenantAdminActorEndpointFilter>();

        routes.MapGet("/api/tenant/profile", GetTenantProfile);
        routes.MapGet("/api/public/catalog", GetCatalog);
        routes.MapGet("/api/public/tables", ListActiveTables);
        routes.MapPost("/api/public/token/verify", VerifyTableToken);
        routes.MapGet("/api/public/session", GetCustomerSessionStatus);
        routes.MapPost("/api/public/session/logout", LogoutCustomerSession);
        routes.MapPost("/api/public/orders", CreateOrder);
        routes.MapGet("/api/admin/bootstrap-status", GetBootstrapStatus);
        routes.MapPost("/api/admin/bootstrap", BootstrapAdmin);
        routes.MapPost("/api/admin/auth/login", LoginAdmin).RequireRateLimiting("auth-login");
        adminGroup.MapPost("/auth/change-password", ChangePassword);
        adminGroup.MapGet("/catalog", GetAdminCatalog);
        adminGroup.MapGet("/floor-layout", GetFloorLayoutDocument);
        adminGroup.MapPost("/floor-layout", SaveFloorLayoutDocument);
        adminGroup.MapGet("/stations", ListStations);
        adminGroup.MapPost("/stations", CreateStation);
        adminGroup.MapPut("/stations/{stationId:guid}", UpdateStation);
        adminGroup.MapDelete("/stations/{stationId:guid}", DeleteStation);
        adminGroup.MapGet("/kitchen", GetKitchenBoard);
        adminGroup.MapPost("/kitchen/items/{orderItemId:guid}/status", UpdateKitchenItemStatus);
        adminGroup.MapGet("/tables", ListAdminTables);
        adminGroup.MapPost("/tables", CreateTable);
        adminGroup.MapPost("/tables/layouts", SaveTableLayouts);
        adminGroup.MapPut("/tables/{tableId:guid}", UpdateTable);
        adminGroup.MapDelete("/tables/{tableId:guid}", DeleteTable);
        adminGroup.MapGet("/bills", ListBills);
        adminGroup.MapPost("/bills/{billId:guid}/close", CloseBill);
        adminGroup.MapPost("/bills/{billId:guid}/move", MoveBill);
        adminGroup.MapPost("/bills/{targetBillId:guid}/merge", MergeBill);
        adminGroup.MapPost("/bills/{sourceBillId:guid}/split", SplitBill);
        adminGroup.MapPost("/catalog/categories", CreateCategory);
        adminGroup.MapPut("/catalog/categories/{categoryId:guid}", UpdateCategory);
        adminGroup.MapPost("/catalog/items", CreateItem);
        adminGroup.MapPut("/catalog/items/{itemId:guid}", UpdateItem);
        adminGroup.MapGet("/orders", ListOrders);
        adminGroup.MapPost("/orders", CreateAdminOrder);
        adminGroup.MapPost("/orders/{orderId:guid}/status", UpdateOrderStatus);
        adminGroup.MapGet("/devices", ListDevices);
        adminGroup.MapPost("/devices/{tableId:guid}/rotate-key", RotateDeviceKey);
        adminGroup.MapPost("/devices/{tableId:guid}/refresh-token", RefreshDeviceToken);

        return routes;
    }

    private static async Task<IResult> GetTenantProfile(TenantDbContext db, CancellationToken cancellationToken)
    {
        var profile = await db.TenantProfiles.AsNoTracking().OrderBy(profile => profile.CreatedAt).FirstAsync(cancellationToken);

        return Results.Ok(ToResponse(profile));
    }

    private static async Task<IResult> GetCatalog(TenantDbContext db, CancellationToken cancellationToken)
    {
        var profile = await db.TenantProfiles.AsNoTracking().OrderBy(profile => profile.CreatedAt).FirstAsync(cancellationToken);
        var categories = await db.MenuCategories
            .AsNoTracking()
            .Include(category => category.Station)
            .Where(category => category.IsActive)
            .Include(category => category.Items.Where(item => item.IsAvailable))
                .ThenInclude(item => item.Station)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .ToListAsync(cancellationToken);

        return Results.Ok(new CatalogResponse(
            ToResponse(profile),
            categories.Select(category => new MenuCategoryResponse(
                    category.Id,
                    category.Slug,
                    category.Name,
                    category.StationId,
                    category.Station != null ? category.Station.Name : null,
                    category.SortOrder,
                    category.Items
                        .OrderBy(item => item.SortOrder)
                        .ThenBy(item => item.Name)
                        .Select(item => new MenuItemResponse(
                            item.Id,
                            item.Sku,
                            item.Name,
                            item.Description,
                            item.StationId ?? category.StationId,
                            item.Station != null ? item.Station.Name : category.Station != null ? category.Station.Name : null,
                            item.PriceMinor,
                            item.CurrencyCode,
                            item.SortOrder))
                        .ToArray()))
                .ToArray()));
    }

    private static async Task<IResult> GetFloorLayoutDocument(
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var profile = await db.TenantProfiles.AsNoTracking().OrderBy(profile => profile.CreatedAt).FirstAsync(cancellationToken);
        return Results.Ok(new { floorLayoutJson = profile.FloorLayoutJson });
    }

    private static async Task<IResult> ListActiveTables(TenantDbContext db, CancellationToken cancellationToken)
    {
        var tables = await db.ServiceTables
            .AsNoTracking()
            .Where(table => table.IsActive)
            .OrderBy(table => table.Number)
            .Select(table => new ServiceTableResponse(table.Id, table.Number, table.Name))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(tables);
    }

    private static async Task<IResult> GetBootstrapStatus(
        TenantDbContext db,
        IOptions<TenantRuntimeOptions> runtimeOptions,
        CancellationToken cancellationToken)
    {
        var hasAdmins = await db.TenantAdmins.AnyAsync(admin => admin.IsActive, cancellationToken);
        var options = runtimeOptions.Value;

        return Results.Ok(new TenantAdminBootstrapStatusResponse(
            !hasAdmins,
            TenantDatabaseInitializer.ResolveInitialAdminEmail(options)));
    }

    private static async Task<IResult> BootstrapAdmin(
        HttpContext context,
        BootstrapTenantAdminRequest request,
        TenantDbContext db,
        IOptions<TenantRuntimeOptions> options,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var expectedEmail = options.Value.InitialAdminEmail.Trim().ToLowerInvariant();
        var expectedToken = options.Value.BootstrapToken.Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Email is required."],
                ["password"] = ["Password is required."]
            });
        }

        if (!string.IsNullOrWhiteSpace(expectedEmail) && email != expectedEmail)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Email must match the tenant's configured initial admin email."]
            });
        }

        if (!string.IsNullOrWhiteSpace(expectedToken)
            && !FixedTimeEquals(context.Request.Headers["X-Tenant-Bootstrap-Token"].ToString(), expectedToken))
        {
            return Results.Problem("Tenant bootstrap token is invalid.", statusCode: StatusCodes.Status401Unauthorized);
        }

        if (string.IsNullOrWhiteSpace(expectedEmail)
            && string.IsNullOrWhiteSpace(expectedToken)
            && !environment.IsDevelopment())
        {
            return Results.Problem("Tenant bootstrap is not configured.", statusCode: StatusCodes.Status403Forbidden);
        }

        await using var bootstrapTransaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, "tenant-admin-bootstrap", cancellationToken);

        if (await db.TenantAdmins.AnyAsync(admin => admin.IsActive, cancellationToken))
        {
            return Results.Conflict(new { message = "Tenant admin already exists." });
        }

        var admin = new TenantAdmin
        {
            Email = email,
            PasswordHash = TenantPasswordHasher.Hash(request.Password),
            MustChangePassword = false
        };

        db.TenantAdmins.Add(admin);
        await db.SaveChangesAsync(cancellationToken);
        await bootstrapTransaction.CommitAsync(cancellationToken);

        return Results.Created(
            $"/api/admin/admins/{admin.Id}",
            new TenantAdminProfileResponse(admin.Id, admin.Email, admin.CreatedAt, admin.MustChangePassword));
    }

    private static bool FixedTimeEquals(string provided, string expected)
    {
        if (string.IsNullOrWhiteSpace(provided))
        {
            return false;
        }

        var providedHash = SHA256.HashData(Encoding.UTF8.GetBytes(provided.Trim()));
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        return CryptographicOperations.FixedTimeEquals(providedHash, expectedHash);
    }

    private static async Task<IResult> LoginAdmin(
        TenantAdminLoginRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["email"] = ["Email is required."],
                ["password"] = ["Password is required."]
            });
        }

        var admin = await db.TenantAdmins
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Email == email && current.IsActive, cancellationToken);

        if (admin is null || !TenantPasswordHasher.Verify(request.Password, admin.PasswordHash))
        {
            return Results.Unauthorized();
        }

        return Results.Ok(
            new TenantAdminSessionResponse(
                admin.Id,
                admin.Email,
                admin.CreatedAt,
                DateTimeOffset.UtcNow,
                admin.MustChangePassword));
    }

    private static async Task<IResult> ChangePassword(
        ChangeTenantAdminPasswordRequest request,
        HttpContext context,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var actor = TenantAdminActorAccessor.Read(context);
        if (actor is null)
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["currentPassword"] = ["Current password is required."],
                ["newPassword"] = ["New password is required."]
            });
        }

        if (request.NewPassword.Length < 10)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["newPassword"] = ["New password must be at least 10 characters."]
            });
        }

        var admin = await db.TenantAdmins.FirstOrDefaultAsync(
            current => current.Id == actor.AdminId && current.IsActive,
            cancellationToken);

        if (admin is null || !TenantPasswordHasher.Verify(request.CurrentPassword, admin.PasswordHash))
        {
            return Results.Problem("Current password is invalid.", statusCode: StatusCodes.Status401Unauthorized);
        }

        admin.PasswordHash = TenantPasswordHasher.Hash(request.NewPassword);
        admin.MustChangePassword = false;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new TenantAdminProfileResponse(admin.Id, admin.Email, admin.CreatedAt, admin.MustChangePassword));
    }

    private static async Task<IResult> ListOrders(TenantDbContext db, CancellationToken cancellationToken)
    {
        var orders = await db.CustomerOrders
            .AsNoTracking()
            .Include(order => order.Table)
            .Include(order => order.Items)
            .ThenInclude(item => item.MenuItem)
            .OrderByDescending(order => order.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var response = orders
            .Select(order => new CustomerOrderSummaryResponse(
                order.Id,
                order.BillId,
                order.TableId,
                order.Table != null ? order.Table.Number : null,
                order.Table != null ? order.Table.Name : null,
                order.Status,
                CustomerOrderWorkflow.GetAllowedNextStatuses(order.Status),
                order.Note,
                order.SubtotalMinor,
                order.CurrencyCode,
                order.CreatedAt,
                order.UpdatedAt,
                order.Items
                    .OrderBy(item => item.Id)
                    .Select(ToOrderItemResponse)
                    .ToArray()))
            .ToArray();

        return Results.Ok(response);
    }

    private static async Task<IResult> UpdateOrderStatus(
        Guid orderId,
        UpdateCustomerOrderStatusRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var order = await db.CustomerOrders
            .Include(current => current.Items)
            .FirstOrDefaultAsync(current => current.Id == orderId, cancellationToken);

        if (order is null)
        {
            return Results.NotFound();
        }

        if (!CustomerOrderWorkflow.CanTransition(order.Status, request.Status))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["status"] = [$"Cannot transition order from {order.Status} to {request.Status}."]
            });
        }

        CustomerOrderProgressService.ApplyOrderStatusToItems(order, request.Status);

        await db.SaveChangesAsync(cancellationToken);

        if (order.BillId is not null)
        {
            await CustomerBillService.RecalculateSubtotalAsync(db, order.BillId.Value, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }

        return Results.NoContent();
    }

    private static async Task<IResult> CreateAdminOrder(
        CreateAdminOrderRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        if (request.TableId == Guid.Empty)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["tableId"] = ["Table is required."]
            });
        }

        return await CreateOrderForTableAsync(
            db,
            request.TableId,
            request.Note,
            request.Items,
            "/api/admin/orders",
            cancellationToken);
    }

    private static async Task<IResult> GetAdminCatalog(TenantDbContext db, CancellationToken cancellationToken)
    {
        var profile = await db.TenantProfiles.AsNoTracking().OrderBy(profile => profile.CreatedAt).FirstAsync(cancellationToken);
        var categories = await db.MenuCategories
            .AsNoTracking()
            .Include(category => category.Station)
            .Include(category => category.Items)
                .ThenInclude(item => item.Station)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .ToListAsync(cancellationToken);

        return Results.Ok(new CatalogResponse(
            ToResponse(profile),
            categories.Select(ToCategoryResponse).ToArray()));
    }

    private static async Task<IResult> ListStations(TenantDbContext db, CancellationToken cancellationToken)
    {
        var stations = await db.ServiceStations
            .AsNoTracking()
            .OrderBy(station => station.SortOrder)
            .ThenBy(station => station.Name)
            .ToArrayAsync(cancellationToken);

        return Results.Ok(stations.Select(ToStationResponse));
    }

    private static async Task<IResult> CreateStation(
        UpsertServiceStationRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var code = CatalogValidation.NormalizeCode(request.Code);
        var name = request.Name.Trim();
        var colorHex = NormalizeColor(request.ColorHex);

        if (!CatalogValidation.IsValidTenantCode(code) || string.IsNullOrWhiteSpace(name) || colorHex is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["code"] = ["Station code is invalid."],
                ["name"] = ["Station name is required."],
                ["colorHex"] = ["Color must be a valid hex value like #2563eb."]
            });
        }

        if (await db.ServiceStations.AnyAsync(station => station.Code == code, cancellationToken))
        {
            return Results.Conflict(new { message = "Station code already exists." });
        }

        var station = new ServiceStation
        {
            Code = code,
            Name = name,
            ColorHex = colorHex,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        db.ServiceStations.Add(station);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/admin/stations/{station.Id}", ToStationResponse(station));
    }

    private static async Task<IResult> UpdateStation(
        Guid stationId,
        UpsertServiceStationRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var station = await db.ServiceStations.FirstOrDefaultAsync(current => current.Id == stationId, cancellationToken);
        if (station is null)
        {
            return Results.NotFound();
        }

        var code = CatalogValidation.NormalizeCode(request.Code);
        var name = request.Name.Trim();
        var colorHex = NormalizeColor(request.ColorHex);

        if (!CatalogValidation.IsValidTenantCode(code) || string.IsNullOrWhiteSpace(name) || colorHex is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["code"] = ["Station code is invalid."],
                ["name"] = ["Station name is required."],
                ["colorHex"] = ["Color must be a valid hex value like #2563eb."]
            });
        }

        if (await db.ServiceStations.AnyAsync(current => current.Id != stationId && current.Code == code, cancellationToken))
        {
            return Results.Conflict(new { message = "Station code already exists." });
        }

        station.Code = code;
        station.Name = name;
        station.ColorHex = colorHex;
        station.SortOrder = request.SortOrder;
        station.IsActive = request.IsActive;
        station.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToStationResponse(station));
    }

    private static async Task<IResult> DeleteStation(
        Guid stationId,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var station = await db.ServiceStations.FirstOrDefaultAsync(current => current.Id == stationId, cancellationToken);
        if (station is null)
        {
            return Results.NotFound();
        }

        if (await db.MenuCategories.AnyAsync(category => category.StationId == stationId, cancellationToken))
        {
            return Results.Conflict(new { message = "Station is assigned to categories. Reassign them first." });
        }

        db.ServiceStations.Remove(station);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ListAdminTables(
        TenantDbContext db,
        DeviceConnectionRegistry registry,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var tables = await db.ServiceTables
            .AsNoTracking()
            .OrderBy(table => table.Number)
            .ToListAsync(cancellationToken);

        var tableIds = tables.Select(table => table.Id).ToArray();
        var openBills = await db.CustomerBills
            .AsNoTracking()
            .Where(bill => tableIds.Contains(bill.TableId) && bill.ClosedAt == null)
            .ToDictionaryAsync(bill => bill.TableId, cancellationToken);

        var sessions = await db.CustomerSessions
            .AsNoTracking()
            .Where(session => tableIds.Contains(session.TableId) && session.ClosedAt == null && session.ExpiresAt > now)
            .GroupBy(session => session.TableId)
            .Select(group => new { TableId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(group => group.TableId, group => group.Count, cancellationToken);

        var orderGroups = await db.CustomerOrders
            .AsNoTracking()
            .Where(order =>
                order.TableId != null
                && tableIds.Contains(order.TableId.Value)
                && (order.Status == CustomerOrderStatus.Submitted
                    || order.Status == CustomerOrderStatus.Preparing
                    || order.Status == CustomerOrderStatus.Ready))
            .GroupBy(order => new { TableId = order.TableId!.Value, order.Status })
            .Select(group => new { group.Key.TableId, group.Key.Status, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var orderCounts = orderGroups
            .GroupBy(group => group.TableId)
            .ToDictionary(
                group => group.Key,
                group => group.ToDictionary(item => item.Status, item => item.Count));

        var response = tables.Select(table =>
        {
            var tableOrderCounts = orderCounts.TryGetValue(table.Id, out var counts)
                ? counts
                : null;
            var openBill = openBills.GetValueOrDefault(table.Id);

            return new AdminTableSummaryResponse(
                table.Id,
                table.Number,
                table.Name,
                table.ServiceNote,
                table.LayoutCode,
                table.LayoutX,
                table.LayoutY,
                table.IsActive,
                registry.IsOnline(table.Id),
                sessions.GetValueOrDefault(table.Id),
                tableOrderCounts?.GetValueOrDefault(CustomerOrderStatus.Submitted) ?? 0,
                tableOrderCounts?.GetValueOrDefault(CustomerOrderStatus.Preparing) ?? 0,
                tableOrderCounts?.GetValueOrDefault(CustomerOrderStatus.Ready) ?? 0,
                openBill?.Id,
                openBill?.SubtotalMinor ?? 0,
                openBill?.CurrencyCode,
                table.UpdatedAt);
        });

        return Results.Ok(response);
    }

    private static async Task<IResult> CreateTable(
        UpsertServiceTableRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        var serviceNote = request.ServiceNote.Trim();
        var layoutCode = request.LayoutCode.Trim();

        if (request.Number <= 0 || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(layoutCode) || serviceNote.Length > 1200)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["number"] = ["Table number must be greater than zero."],
                ["name"] = ["Table name is required."],
                ["layoutCode"] = ["Layout code is required."],
                ["serviceNote"] = ["Service note must be 1200 characters or fewer."]
            });
        }

        if (await db.ServiceTables.AnyAsync(table => table.Number == request.Number, cancellationToken))
        {
            return Results.Conflict(new { message = "Table number already exists." });
        }

        var table = new ServiceTable
        {
            Number = request.Number,
            Name = name,
            ServiceNote = serviceNote,
            LayoutCode = layoutCode,
            LayoutX = request.LayoutX,
            LayoutY = request.LayoutY,
            IsActive = request.IsActive
        };

        db.ServiceTables.Add(table);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/admin/tables/{table.Id}", new ServiceTableResponse(table.Id, table.Number, table.Name));
    }

    private static async Task<IResult> UpdateTable(
        Guid tableId,
        UpsertServiceTableRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var table = await db.ServiceTables.FirstOrDefaultAsync(current => current.Id == tableId, cancellationToken);
        if (table is null)
        {
            return Results.NotFound();
        }

        var name = request.Name.Trim();
        var serviceNote = request.ServiceNote.Trim();
        var layoutCode = request.LayoutCode.Trim();

        if (request.Number <= 0 || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(layoutCode) || serviceNote.Length > 1200)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["number"] = ["Table number must be greater than zero."],
                ["name"] = ["Table name is required."],
                ["layoutCode"] = ["Layout code is required."],
                ["serviceNote"] = ["Service note must be 1200 characters or fewer."]
            });
        }

        if (await db.ServiceTables.AnyAsync(current => current.Id != tableId && current.Number == request.Number, cancellationToken))
        {
            return Results.Conflict(new { message = "Table number already exists." });
        }

        table.Number = request.Number;
        table.Name = name;
        table.ServiceNote = serviceNote;
        table.LayoutCode = layoutCode;
        table.LayoutX = request.LayoutX;
        table.LayoutY = request.LayoutY;
        table.IsActive = request.IsActive;
        table.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new ServiceTableResponse(table.Id, table.Number, table.Name));
    }

    private static async Task<IResult> DeleteTable(
        Guid tableId,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var table = await db.ServiceTables.FirstOrDefaultAsync(current => current.Id == tableId, cancellationToken);
        if (table is null)
        {
            return Results.NotFound();
        }

        var hasHistory =
            await db.CustomerOrders.AnyAsync(order => order.TableId == tableId, cancellationToken) ||
            await db.CustomerBills.AnyAsync(bill => bill.TableId == tableId, cancellationToken) ||
            await db.CustomerSessions.AnyAsync(session => session.TableId == tableId, cancellationToken) ||
            await db.DeviceKeys.AnyAsync(key => key.TableId == tableId, cancellationToken) ||
            await db.TableTokens.AnyAsync(token => token.TableId == tableId, cancellationToken);

        if (hasHistory)
        {
            return Results.Conflict(new
            {
                message = "Table has operational history. Deactivate it instead of deleting."
            });
        }

        db.ServiceTables.Remove(table);
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> SaveTableLayouts(
        IReadOnlyList<UpdateTableLayoutEntryRequest> request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        if (request.Count == 0)
        {
            return Results.Ok();
        }

        var tableIds = request.Select(item => item.TableId).Distinct().ToArray();
        var tables = await db.ServiceTables.Where(table => tableIds.Contains(table.Id)).ToListAsync(cancellationToken);

        if (tables.Count != tableIds.Length)
        {
            return Results.NotFound(new { message = "One or more tables were not found." });
        }

        foreach (var entry in request)
        {
            var layoutCode = entry.LayoutCode.Trim();
            if (string.IsNullOrWhiteSpace(layoutCode))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["layoutCode"] = ["Layout code is required."]
                });
            }

            var table = tables.First(current => current.Id == entry.TableId);
            table.LayoutCode = layoutCode;
            table.LayoutX = entry.LayoutX;
            table.LayoutY = entry.LayoutY;
            table.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok();
    }

    private static async Task<IResult> SaveFloorLayoutDocument(
        FloorLayoutDocumentRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var profile = await db.TenantProfiles.OrderBy(profile => profile.CreatedAt).FirstAsync(cancellationToken);
        profile.FloorLayoutJson = string.IsNullOrWhiteSpace(request.FloorLayoutJson) ? "{}" : request.FloorLayoutJson;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok();
    }

    private static async Task<IResult> CreateCategory(
        UpsertMenuCategoryRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var slug = CatalogValidation.NormalizeSlug(request.Slug);
        var name = request.Name.Trim();
        var station = request.StationId is null
            ? null
            : await db.ServiceStations.FirstOrDefaultAsync(current => current.Id == request.StationId.Value, cancellationToken);

        if (!CatalogValidation.IsValidSlug(slug) || string.IsNullOrWhiteSpace(name) || (request.StationId is not null && station is null))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slug"] = ["Slug must contain only lowercase letters, numbers, and hyphens."],
                ["name"] = ["Name is required."],
                ["stationId"] = ["Station must exist when selected."]
            });
        }

        if (await db.MenuCategories.AnyAsync(category => category.Slug == slug, cancellationToken))
        {
            return Results.Conflict(new { message = "Category slug already exists." });
        }

        var category = new MenuCategory
        {
            Slug = slug,
            Name = name,
            StationId = station?.Id,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        db.MenuCategories.Add(category);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/admin/catalog/categories/{category.Id}", ToCategoryResponse(category));
    }

    private static async Task<IResult> UpdateCategory(
        Guid categoryId,
        UpsertMenuCategoryRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var category = await db.MenuCategories.Include(current => current.Items).FirstOrDefaultAsync(current => current.Id == categoryId, cancellationToken);

        if (category is null)
        {
            return Results.NotFound();
        }

        var slug = CatalogValidation.NormalizeSlug(request.Slug);
        var name = request.Name.Trim();
        var station = request.StationId is null
            ? null
            : await db.ServiceStations.FirstOrDefaultAsync(current => current.Id == request.StationId.Value, cancellationToken);

        if (!CatalogValidation.IsValidSlug(slug) || string.IsNullOrWhiteSpace(name) || (request.StationId is not null && station is null))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slug"] = ["Slug must contain only lowercase letters, numbers, and hyphens."],
                ["name"] = ["Name is required."],
                ["stationId"] = ["Station must exist when selected."]
            });
        }

        if (await db.MenuCategories.AnyAsync(current => current.Id != categoryId && current.Slug == slug, cancellationToken))
        {
            return Results.Conflict(new { message = "Category slug already exists." });
        }

        category.Slug = slug;
        category.Name = name;
        category.StationId = station?.Id;
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToCategoryResponse(category));
    }

    private static async Task<IResult> CreateItem(
        UpsertMenuItemRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var category = await db.MenuCategories.FirstOrDefaultAsync(current => current.Id == request.CategoryId, cancellationToken);
        if (category is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["categoryId"] = ["Category was not found."]
            });
        }

        var sku = request.Sku.Trim().ToLowerInvariant();
        var name = request.Name.Trim();
        var currencyCode = CatalogValidation.NormalizeCurrency(request.CurrencyCode);
        var station = request.StationId is null
            ? null
            : await db.ServiceStations.FirstOrDefaultAsync(current => current.Id == request.StationId.Value, cancellationToken);

        if (string.IsNullOrWhiteSpace(sku) || string.IsNullOrWhiteSpace(name) || request.PriceMinor <= 0 || (request.StationId is not null && station is null))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["sku"] = ["SKU is required."],
                ["name"] = ["Name is required."],
                ["priceMinor"] = ["Price must be greater than zero."],
                ["stationId"] = ["Station must exist when selected."]
            });
        }

        if (await db.MenuItems.AnyAsync(item => item.Sku == sku, cancellationToken))
        {
            return Results.Conflict(new { message = "Menu item SKU already exists." });
        }

        var item = new MenuItem
        {
            CategoryId = category.Id,
            StationId = station?.Id,
            Sku = sku,
            Name = name,
            Description = request.Description.Trim(),
            PriceMinor = request.PriceMinor,
            CurrencyCode = currencyCode,
            SortOrder = request.SortOrder,
            IsAvailable = request.IsAvailable
        };

        db.MenuItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/admin/catalog/items/{item.Id}", ToItemResponse(item));
    }

    private static async Task<IResult> UpdateItem(
        Guid itemId,
        UpsertMenuItemRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var item = await db.MenuItems.FirstOrDefaultAsync(current => current.Id == itemId, cancellationToken);
        if (item is null)
        {
            return Results.NotFound();
        }

        var category = await db.MenuCategories.FirstOrDefaultAsync(current => current.Id == request.CategoryId, cancellationToken);
        if (category is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["categoryId"] = ["Category was not found."]
            });
        }

        var sku = request.Sku.Trim().ToLowerInvariant();
        var name = request.Name.Trim();
        var currencyCode = CatalogValidation.NormalizeCurrency(request.CurrencyCode);
        var station = request.StationId is null
            ? null
            : await db.ServiceStations.FirstOrDefaultAsync(current => current.Id == request.StationId.Value, cancellationToken);

        if (string.IsNullOrWhiteSpace(sku) || string.IsNullOrWhiteSpace(name) || request.PriceMinor <= 0 || (request.StationId is not null && station is null))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["sku"] = ["SKU is required."],
                ["name"] = ["Name is required."],
                ["priceMinor"] = ["Price must be greater than zero."],
                ["stationId"] = ["Station must exist when selected."]
            });
        }

        if (await db.MenuItems.AnyAsync(current => current.Id != itemId && current.Sku == sku, cancellationToken))
        {
            return Results.Conflict(new { message = "Menu item SKU already exists." });
        }

        item.CategoryId = category.Id;
        item.StationId = station?.Id;
        item.Sku = sku;
        item.Name = name;
        item.Description = request.Description.Trim();
        item.PriceMinor = request.PriceMinor;
        item.CurrencyCode = currencyCode;
        item.SortOrder = request.SortOrder;
        item.IsAvailable = request.IsAvailable;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(ToItemResponse(item));
    }

    private static async Task<IResult> GetKitchenBoard(
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var stations = await db.ServiceStations
            .AsNoTracking()
            .Where(station => station.IsActive)
            .OrderBy(station => station.SortOrder)
            .ThenBy(station => station.Name)
            .ToListAsync(cancellationToken);

        var activeItemStatuses = new[]
        {
            CustomerOrderStatus.Submitted,
            CustomerOrderStatus.Preparing,
            CustomerOrderStatus.Ready
        };

        var items = await db.CustomerOrderItems
            .AsNoTracking()
            .Include(item => item.Order)!.ThenInclude(order => order!.Table)
            .Include(item => item.MenuItem)!.ThenInclude(menuItem => menuItem!.Station)
            .Include(item => item.MenuItem)!.ThenInclude(menuItem => menuItem!.Category)!.ThenInclude(category => category!.Station)
            .Where(item => activeItemStatuses.Contains(item.Status))
            .OrderBy(item => item.Order!.CreatedAt)
            .ToListAsync(cancellationToken);

        var grouped = items.ToLookup(item => item.MenuItem?.StationId ?? item.MenuItem?.Category?.StationId);

        var boards = stations
            .Select(station => new KitchenStationBoardResponse(
                station.Id,
                station.Code,
                station.Name,
                station.ColorHex,
                grouped[station.Id].Select(ToKitchenItemResponse).ToArray()))
            .ToList();

        var unassignedItems = grouped[null].Select(ToKitchenItemResponse).ToArray();
        if (unassignedItems.Length > 0)
        {
            boards.Insert(0, new KitchenStationBoardResponse(
                null,
                "unassigned",
                "Atanmamis",
                "#64748b",
                unassignedItems));
        }

        return Results.Ok(boards);
    }

    private static async Task<IResult> UpdateKitchenItemStatus(
        Guid orderItemId,
        UpdateCustomerOrderStatusRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        var item = await db.CustomerOrderItems
            .Include(current => current.Order)!.ThenInclude(order => order!.Items)
            .FirstOrDefaultAsync(current => current.Id == orderItemId, cancellationToken);

        if (item is null || item.Order is null)
        {
            return Results.NotFound();
        }

        if (!CustomerOrderProgressService.GetAllowedKitchenItemStatuses(item.Status).Contains(request.Status))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["status"] = [$"Cannot transition kitchen item from {item.Status} to {request.Status}."]
            });
        }

        item.Status = request.Status;
        CustomerOrderProgressService.SyncOrderFromItems(item.Order);
        await db.SaveChangesAsync(cancellationToken);

        if (item.Order.BillId is not null)
        {
            await CustomerBillService.RecalculateSubtotalAsync(db, item.Order.BillId.Value, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }

        return Results.NoContent();
    }

    private static async Task<IResult> CreateOrder(
        HttpContext context,
        CreateCustomerOrderRequest request,
        TenantDbContext db,
        CustomerSessionService sessionService,
        CancellationToken cancellationToken)
    {
        var sessionToken = context.Request.Headers["X-Customer-Session-Token"].ToString();
        var activeSession = await sessionService.ValidateAsync(db, sessionToken, cancellationToken);
        if (activeSession is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["session"] = ["Active customer session is required to create an order."]
            });
        }

        var effectiveTableId = activeSession.TableId;
        if (!await db.ServiceTables.AsNoTracking().AnyAsync(current => current.Id == effectiveTableId && current.IsActive, cancellationToken))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["session"] = ["Session table was not found or is not active."]
            });
        }

        var currentSession = await db.CustomerSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(
                session => session.Id == activeSession.SessionId
                    && session.TableId == effectiveTableId
                    && session.ClosedAt == null
                    && session.ExpiresAt > DateTimeOffset.UtcNow,
                cancellationToken);

        if (currentSession is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["session"] = ["Active customer session is required to create an order."]
            });
        }

        return await CreateOrderForTableAsync(
            db,
            effectiveTableId,
            request.Note,
            request.Items,
            "/api/public/orders",
            cancellationToken);
    }

    private static async Task<IResult> CreateOrderForTableAsync(
        TenantDbContext db,
        Guid tableId,
        string note,
        IReadOnlyList<CreateCustomerOrderItemRequest> items,
        string locationBasePath,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["items"] = ["Order must contain at least one item."]
            });
        }

        var table = await db.ServiceTables
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Id == tableId && current.IsActive, cancellationToken);

        if (table is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["tableId"] = ["Table was not found or is not active."]
            });
        }

        var menuItemIds = items.Select(item => item.MenuItemId).Distinct().ToArray();
        var menuItems = await db.MenuItems
            .AsNoTracking()
            .Where(item => menuItemIds.Contains(item.Id))
            .ToListAsync(cancellationToken);

        if (menuItems.Count != menuItemIds.Length)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["items"] = ["One or more menu items could not be found."]
            });
        }

        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{tableId}", cancellationToken);

            var currencyCode = menuItems.Select(item => item.CurrencyCode).Distinct().Single();
            var order = CustomerOrderFactory.Build(tableId, note, currencyCode, menuItems, items);
            var bill = await CustomerBillService.GetOrCreateOpenBillAsync(db, tableId, currencyCode, cancellationToken);
            order.BillId = bill.Id;

            db.CustomerOrders.Add(order);
            await db.SaveChangesAsync(cancellationToken);
            await CustomerBillService.RecalculateSubtotalAsync(db, order.BillId.Value, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            var createdOrder = await db.CustomerOrders
                .AsNoTracking()
                .Include(current => current.Table)
                .Include(current => current.Items)
                .ThenInclude(item => item.MenuItem)
                .FirstAsync(current => current.Id == order.Id, cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return Results.Created($"{locationBasePath}/{order.Id}", ToDetailResponse(createdOrder));
        }
        catch (InvalidOperationException exception)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["items"] = [exception.Message]
            });
        }
    }

    private static async Task<IResult> VerifyTableToken(
        VerifyTableTokenRequest request,
        TenantDbContext db,
        TableTokenService tokenService,
        CustomerSessionService sessionService,
        CancellationToken cancellationToken)
    {
        var verified = await tokenService.VerifyAsync(db, request.Token, sessionService, cancellationToken);
        if (verified is null)
        {
            return Results.Unauthorized();
        }

        var profile = await db.TenantProfiles.AsNoTracking().OrderBy(current => current.CreatedAt).FirstAsync(cancellationToken);

        return Results.Ok(new VerifiedCustomerSessionResponse(
            verified.SessionId,
            verified.SessionToken,
            verified.TableId,
            verified.TableNumber,
            verified.TableName,
            profile.Code,
            profile.DisplayName,
            profile.PrimaryDomain,
            verified.SessionExpiresAt));
    }

    private static async Task<IResult> GetCustomerSessionStatus(
        HttpContext context,
        TenantDbContext db,
        CustomerSessionService sessionService,
        CancellationToken cancellationToken)
    {
        var sessionToken = context.Request.Headers["X-Customer-Session-Token"].ToString();
        var session = await sessionService.ValidateAsync(db, sessionToken, cancellationToken);

        if (session is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new CustomerSessionStatusResponse(
            session.SessionId,
            session.TableId,
            session.TableNumber,
            session.TableName,
            session.OpenedAt,
            session.ExpiresAt,
            session.LastSeenAt));
    }

    private static async Task<IResult> LogoutCustomerSession(
        HttpContext context,
        TenantDbContext db,
        CustomerSessionService sessionService,
        CancellationToken cancellationToken)
    {
        var sessionToken = context.Request.Headers["X-Customer-Session-Token"].ToString();
        var closed = await sessionService.CloseAsync(db, sessionToken, cancellationToken);

        return closed ? Results.NoContent() : Results.Unauthorized();
    }

    private static async Task<IResult> ListDevices(
        TenantDbContext db,
        DeviceConnectionRegistry registry,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var tables = await db.ServiceTables
            .AsNoTracking()
            .Include(table => table.DeviceKeys.Where(key => key.IsActive))
            .OrderBy(table => table.Number)
            .ToListAsync(cancellationToken);

        var tableIds = tables.Select(table => table.Id).ToArray();
        var activeTokens = await db.TableTokens
            .AsNoTracking()
            .Where(token => tableIds.Contains(token.TableId) && token.ConsumedAt == null && token.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        var response = tables.Select(table =>
        {
            var key = table.DeviceKeys.OrderByDescending(current => current.CreatedAt).FirstOrDefault();
            var token = activeTokens
                .Where(current => current.TableId == table.Id)
                .OrderByDescending(current => current.CreatedAt)
                .FirstOrDefault();

            return new AdminDeviceResponse(
                table.Id,
                table.Number,
                table.Name,
                table.IsActive,
                registry.IsOnline(table.Id),
                key is null ? null : new DeviceKeySummaryResponse(key.Id, key.KeyHint, key.IsActive, key.LastSeenAt, key.CreatedAt),
                token is null ? null : new DeviceTokenSummaryResponse(string.Empty, (int)Math.Max(0, Math.Ceiling((token.ExpiresAt - now).TotalSeconds)), token.ExpiresAt));
        });

        return Results.Ok(response);
    }

    private static async Task<IResult> RotateDeviceKey(
        Guid tableId,
        TenantDbContext db,
        IOptions<TenantRuntimeOptions> runtimeOptions,
        DeviceConnectionRegistry registry,
        CancellationToken cancellationToken)
    {
        if (!await db.ServiceTables.AsNoTracking().AnyAsync(current => current.Id == tableId, cancellationToken))
        {
            return Results.NotFound();
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{tableId}", cancellationToken);

        var table = await db.ServiceTables
            .Include(current => current.DeviceKeys)
            .FirstAsync(current => current.Id == tableId, cancellationToken);

        foreach (var deviceKey in table.DeviceKeys.Where(current => current.IsActive))
        {
            deviceKey.IsActive = false;
        }

        var rawKey = DeviceKeyService.GenerateRawKey(table.Number);
        var newKey = new DeviceKey
        {
            TableId = table.Id,
            KeyHash = DeviceKeyService.Hash(rawKey),
            KeyHint = DeviceKeyService.CreateHint(rawKey)
        };

        db.DeviceKeys.Add(newKey);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await registry.CloseAsync(table.Id, WebSocketCloseStatus.PolicyViolation, "device_key_rotated", cancellationToken);

        var response = new RotateDeviceKeyResponse(
            new AdminDeviceResponse(
                table.Id,
                table.Number,
                table.Name,
                table.IsActive,
                false,
                new DeviceKeySummaryResponse(newKey.Id, newKey.KeyHint, newKey.IsActive, newKey.LastSeenAt, newKey.CreatedAt),
                null),
            rawKey,
            RenderFirmwareConfig(runtimeOptions.Value, table.Number, rawKey));

        return Results.Ok(response);
    }

    private static async Task<IResult> RefreshDeviceToken(
        Guid tableId,
        TenantDbContext db,
        TableTokenService tokenService,
        DeviceConnectionRegistry registry,
        CancellationToken cancellationToken)
    {
        var table = await db.ServiceTables.AsNoTracking().FirstOrDefaultAsync(current => current.Id == tableId && current.IsActive, cancellationToken);

        if (table is null)
        {
            return Results.NotFound();
        }

        var payload = await tokenService.RotateAsync(db, table, cancellationToken);
        await registry.SendJsonAsync(table.Id, DeviceWebSocketEndpoint.ToWirePayload(payload), cancellationToken);

        return Results.Ok(new DeviceTokenSummaryResponse(payload.Url, payload.TtlSeconds, payload.ExpiresAt));
    }

    private static async Task<IResult> ListBills(TenantDbContext db, CancellationToken cancellationToken)
    {
        var bills = await db.CustomerBills
            .AsNoTracking()
            .Include(bill => bill.Table)
            .OrderByDescending(bill => bill.OpenedAt)
            .Take(100)
            .Select(bill => new CustomerBillSummaryResponse(
                bill.Id,
                bill.TableId,
                bill.Table!.Number,
                bill.Table!.Name,
                bill.Status,
                bill.Orders.Count,
                bill.SubtotalMinor,
                bill.CurrencyCode,
                bill.OpenedAt,
                bill.ClosedAt,
                bill.UpdatedAt))
            .ToArrayAsync(cancellationToken);

        return Results.Ok(bills);
    }

    private static async Task<IResult> CloseBill(Guid billId, TenantDbContext db, CancellationToken cancellationToken)
    {
        var closed = await CustomerBillService.CloseBillAsync(db, billId, cancellationToken);
        return closed ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> MoveBill(
        Guid billId,
        MoveBillRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        if (billId == Guid.Empty || request.TargetTableId == Guid.Empty)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["targetTableId"] = ["Target table is required."]
            });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var bill = await db.CustomerBills
            .Include(current => current.Orders)
            .FirstOrDefaultAsync(current => current.Id == billId, cancellationToken);

        if (bill is null || bill.ClosedAt is not null)
        {
            return Results.NotFound();
        }

        if (!await db.ServiceTables.AnyAsync(table => table.Id == request.TargetTableId && table.IsActive, cancellationToken))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["targetTableId"] = ["Target table must be active."]
            });
        }

        if (bill.TableId == request.TargetTableId)
        {
            return Results.NoContent();
        }

        if (await db.CustomerBills.AnyAsync(
            current => current.TableId == request.TargetTableId && current.ClosedAt == null,
            cancellationToken))
        {
            return Results.Conflict(new { message = "Target table already has an open bill. Use merge instead." });
        }

        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{bill.TableId}", cancellationToken);
        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{request.TargetTableId}", cancellationToken);

        var sourceTableId = bill.TableId;
        bill.TableId = request.TargetTableId;
        bill.UpdatedAt = DateTimeOffset.UtcNow;

        foreach (var order in bill.Orders)
        {
            order.TableId = request.TargetTableId;
            order.UpdatedAt = bill.UpdatedAt;
        }

        var sessions = await db.CustomerSessions
            .Where(session => session.TableId == sourceTableId && session.ClosedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.TableId = request.TargetTableId;
            session.LastSeenAt = bill.UpdatedAt;
        }

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> MergeBill(
        Guid targetBillId,
        MergeBillRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        if (targetBillId == Guid.Empty || request.SourceBillId == Guid.Empty || targetBillId == request.SourceBillId)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["sourceBillId"] = ["A different source bill is required."]
            });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var bills = await db.CustomerBills
            .Include(bill => bill.Orders)
            .Where(bill => bill.Id == targetBillId || bill.Id == request.SourceBillId)
            .ToListAsync(cancellationToken);

        var targetBill = bills.FirstOrDefault(bill => bill.Id == targetBillId);
        var sourceBill = bills.FirstOrDefault(bill => bill.Id == request.SourceBillId);

        if (targetBill is null || sourceBill is null || targetBill.ClosedAt is not null || sourceBill.ClosedAt is not null)
        {
            return Results.NotFound();
        }

        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{targetBill.TableId}", cancellationToken);
        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{sourceBill.TableId}", cancellationToken);

        var now = DateTimeOffset.UtcNow;
        foreach (var order in sourceBill.Orders)
        {
            order.BillId = targetBill.Id;
            order.TableId = targetBill.TableId;
            order.UpdatedAt = now;
        }

        var sourceSessions = await db.CustomerSessions
            .Where(session => session.TableId == sourceBill.TableId && session.ClosedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sourceSessions)
        {
            session.TableId = targetBill.TableId;
            session.LastSeenAt = now;
        }

        sourceBill.Status = CustomerBillStatus.Closed;
        sourceBill.ClosedAt = now;
        sourceBill.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);
        await CustomerBillService.RecalculateSubtotalAsync(db, targetBill.Id, cancellationToken);
        sourceBill.SubtotalMinor = 0;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> SplitBill(
        Guid sourceBillId,
        SplitBillRequest request,
        TenantDbContext db,
        CancellationToken cancellationToken)
    {
        if (sourceBillId == Guid.Empty || request.TargetTableId == Guid.Empty || request.OrderIds.Count == 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["orderIds"] = ["At least one order must be selected."]
            });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var sourceBill = await db.CustomerBills.FirstOrDefaultAsync(
            bill => bill.Id == sourceBillId && bill.ClosedAt == null,
            cancellationToken);

        if (sourceBill is null)
        {
            return Results.NotFound();
        }

        if (!await db.ServiceTables.AnyAsync(table => table.Id == request.TargetTableId && table.IsActive, cancellationToken))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["targetTableId"] = ["Target table must be active."]
            });
        }

        var orders = await db.CustomerOrders
            .Where(order => request.OrderIds.Contains(order.Id) && order.BillId == sourceBillId)
            .ToListAsync(cancellationToken);

        if (orders.Count != request.OrderIds.Distinct().Count())
        {
            return Results.NotFound(new { message = "One or more orders were not found on the source bill." });
        }

        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{sourceBill.TableId}", cancellationToken);
        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{request.TargetTableId}", cancellationToken);

        var targetBill = await CustomerBillService.GetOrCreateOpenBillAsync(
            db,
            request.TargetTableId,
            sourceBill.CurrencyCode,
            cancellationToken);
        var now = DateTimeOffset.UtcNow;

        foreach (var order in orders)
        {
            order.BillId = targetBill.Id;
            order.TableId = targetBill.TableId;
            order.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        await CustomerBillService.RecalculateSubtotalAsync(db, sourceBill.Id, cancellationToken);
        await CustomerBillService.RecalculateSubtotalAsync(db, targetBill.Id, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static TenantProfileResponse ToResponse(TenantProfile profile) =>
        new(
            profile.Id,
            profile.Code,
            profile.DisplayName,
            profile.PrimaryDomain,
            profile.LanguageCode,
            profile.TimeZone,
            profile.CurrencyCode);

    private static CustomerOrderDetailResponse ToDetailResponse(CustomerOrder order) =>
        new(
            order.Id,
            order.BillId,
            order.TableId,
            order.Table?.Number,
            order.Table?.Name,
            order.Status,
            order.Note,
            order.SubtotalMinor,
            order.CurrencyCode,
            order.CreatedAt,
            order.UpdatedAt,
            order.Items
                .OrderBy(item => item.Id)
                .Select(ToOrderItemResponse)
                .ToArray());

    private static CustomerOrderItemResponse ToOrderItemResponse(CustomerOrderItem item) =>
        new(
            item.Id,
            item.MenuItemId,
            item.MenuItem?.Name ?? "Bilinmeyen urun",
            item.Status,
            item.Quantity,
            item.UnitPriceMinor,
            item.LineTotalMinor,
            item.Note);

    private static MenuCategoryResponse ToCategoryResponse(MenuCategory category) =>
        new(
            category.Id,
            category.Slug,
            category.Name,
            category.StationId,
            category.Station?.Name,
            category.SortOrder,
            category.Items
                .OrderBy(item => item.SortOrder)
                .ThenBy(item => item.Name)
                .Select(ToItemResponse)
                .ToArray());

    private static ServiceStationResponse ToStationResponse(ServiceStation station) =>
        new(
            station.Id,
            station.Code,
            station.Name,
            station.ColorHex,
            station.SortOrder,
            station.IsActive);

    private static KitchenTicketItemResponse ToKitchenItemResponse(CustomerOrderItem item) =>
        new(
            item.Id,
            item.OrderId,
            item.Order!.Status,
            item.Status,
            item.Order.TableId,
            item.Order.Table?.Number,
            item.Order.Table?.Name,
            item.MenuItemId,
            item.MenuItem!.Name,
            item.Quantity,
            item.Note,
            item.Order.Note,
            item.Order.CreatedAt);

    private static MenuItemResponse ToItemResponse(MenuItem item) =>
        new(
            item.Id,
            item.Sku,
            item.Name,
            item.Description,
            item.StationId ?? item.Category?.StationId,
            item.Station != null ? item.Station.Name : item.Category?.Station?.Name,
            item.PriceMinor,
            item.CurrencyCode,
            item.SortOrder);

    private static string RenderFirmwareConfig(TenantRuntimeOptions options, int tableNumber, string rawDeviceKey) =>
        $$"""
        #pragma once

        #define WIFI_SSID "CHANGE_ME"
        #define WIFI_PASSWORD "CHANGE_ME"

        #define BACKEND_HOST "{{CatalogValidation.NormalizeHost(options.BaseUrl)}}"
        #define BACKEND_PORT 443

        #define MASA_ID {{tableNumber}}
        #define WS_DEVICE_KEY "{{rawDeviceKey}}"

        #define TFT_SCLK_PIN 0
        #define TFT_MOSI_PIN 1
        #define TFT_MISO_PIN -1
        #define TFT_CS_PIN 4
        #define TFT_DC_PIN 2
        #define TFT_RST_PIN 3
        #define TFT_BL_PIN -1
        #define TFT_BL_ON HIGH
        #define TFT_INITR_OPTION INITR_BLACKTAB
        #define TFT_ROTATION 0

        #define TOKEN_DURATION_MS 60000UL
        #define WIFI_TIMEOUT_MS 20000UL
        #define WS_RECONNECT_MS 3000UL
        #define WS_PING_MS 30000UL
        #define HEARTBEAT_MS 5000UL

        #define SERIAL_BAUD 115200
        """;

    private static string? NormalizeColor(string input)
    {
        var value = input.Trim();
        return System.Text.RegularExpressions.Regex.IsMatch(value, "^#[0-9a-fA-F]{6}$")
            ? value.ToLowerInvariant()
            : null;
    }
}
