using System.Globalization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using TabFlow.Platform.Security;

namespace TabFlow.Platform.Tenants;

public sealed class ProvisioningWorker(
    IServiceProvider services,
    ILogger<ProvisioningWorker> logger) : BackgroundService
{
    private static readonly Action<ILogger, int, Exception?> LogProcessedJobs =
        LoggerMessage.Define<int>(LogLevel.Information, new EventId(1, "ProvisioningJobsProcessed"), "Processed {Count} provisioning jobs.");

    private static readonly Action<ILogger, Exception?> LogWorkerFailure =
        LoggerMessage.Define(LogLevel.Error, new EventId(2, "ProvisioningWorkerFailed"), "Provisioning worker tick failed.");

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = services.CreateAsyncScope();
                var provisioning = scope.ServiceProvider.GetRequiredService<ProvisioningService>();
                var auditWriter = scope.ServiceProvider.GetRequiredService<PlatformAuditWriter>();
                var processed = await provisioning.ProcessPendingJobsAsync(stoppingToken);

                if (processed > 0)
                {
                    LogProcessedJobs(logger, processed, null);
                    await auditWriter.WriteAsync(
                        null,
                        "provisioning.worker.tick",
                        "provision_job_batch",
                        DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(CultureInfo.InvariantCulture),
                        $$"""{"processed":{{processed}}}""",
                        stoppingToken);
                }
            }
            catch (Exception exception)
            {
                LogWorkerFailure(logger, exception);
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}
