function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function tenantLocale(): string {
  return process.env.NEXT_PUBLIC_TENANT_LANGUAGE_CODE === "tr" ? "tr-TR" : "en-GB";
}

function tenantTimeZone(): string {
  return process.env.NEXT_PUBLIC_TENANT_TIME_ZONE ?? "Europe/London";
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(tenantLocale(), {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: tenantTimeZone()
    }).format(date);
  } catch {
    return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} ${pad(
      date.getUTCHours()
    )}:${pad(date.getUTCMinutes())} UTC`;
  }
}

export function formatMoney(minor: number, currencyCode: string | null | undefined): string {
  const currency = currencyCode ?? process.env.NEXT_PUBLIC_TENANT_CURRENCY_CODE ?? "GBP";

  try {
    return new Intl.NumberFormat(tenantLocale(), {
      currency,
      style: "currency"
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}
