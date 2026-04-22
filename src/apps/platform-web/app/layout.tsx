import "./globals.css";
import type { Metadata } from "next";
import { getLocale } from "./i18n/server";

export const metadata: Metadata = {
  title: "TabFlow Platform",
  description: "Platform administration for TabFlow"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
