using Microsoft.EntityFrameworkCore;
using Npgsql;
using TabFlow.Tenant.Api.Data;

namespace TabFlow.Tenant.Api.Orders;

public static class CustomerBillService
{
    public static async Task<CustomerBill?> GetOpenBillAsync(
        TenantDbContext db,
        Guid tableId,
        CancellationToken cancellationToken) =>
        await db.CustomerBills
            .FirstOrDefaultAsync(
                bill => bill.TableId == tableId && bill.ClosedAt == null,
                cancellationToken);

    public static async Task<CustomerBill> GetOrCreateOpenBillAsync(
        TenantDbContext db,
        Guid tableId,
        string currencyCode,
        CancellationToken cancellationToken)
    {
        var openBill = await GetOpenBillAsync(db, tableId, cancellationToken);
        if (openBill is not null)
        {
            return openBill;
        }

        var bill = new CustomerBill
        {
            TableId = tableId,
            CurrencyCode = currencyCode,
            Status = CustomerBillStatus.Open
        };

        db.CustomerBills.Add(bill);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return bill;
        }
        catch (DbUpdateException exception) when (IsUniqueOpenBillViolation(exception))
        {
            db.Entry(bill).State = EntityState.Detached;
            var existingBill = await GetOpenBillAsync(db, tableId, cancellationToken);
            if (existingBill is not null)
            {
                return existingBill;
            }

            throw;
        }
    }

    public static async Task RecalculateSubtotalAsync(
        TenantDbContext db,
        Guid billId,
        CancellationToken cancellationToken)
    {
        var bill = await db.CustomerBills.FirstOrDefaultAsync(current => current.Id == billId, cancellationToken);
        if (bill is null)
        {
            return;
        }

        bill.SubtotalMinor = await db.CustomerOrders
            .Where(order => order.BillId == billId && order.Status != CustomerOrderStatus.Cancelled)
            .SumAsync(order => order.SubtotalMinor, cancellationToken);
        bill.UpdatedAt = DateTimeOffset.UtcNow;
    }

    public static async Task<bool> CloseBillAsync(
        TenantDbContext db,
        Guid billId,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var billSnapshot = await db.CustomerBills
            .AsNoTracking()
            .FirstOrDefaultAsync(current => current.Id == billId, cancellationToken);

        if (billSnapshot is null)
        {
            return false;
        }

        await TenantDatabaseLocks.AcquireTransactionLockAsync(db, $"table:{billSnapshot.TableId}", cancellationToken);

        var bill = await db.CustomerBills.FirstOrDefaultAsync(current => current.Id == billId, cancellationToken);
        if (bill is null || bill.ClosedAt is not null)
        {
            return false;
        }

        bill.Status = CustomerBillStatus.Closed;
        bill.ClosedAt = DateTimeOffset.UtcNow;
        bill.UpdatedAt = bill.ClosedAt.Value;

        var sessions = await db.CustomerSessions
            .Where(session => session.TableId == bill.TableId && session.ClosedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.ClosedAt = bill.ClosedAt;
            session.LastSeenAt = bill.ClosedAt.Value;
        }

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private static bool IsUniqueOpenBillViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: "ux_customer_bills_open_table"
        };
}
