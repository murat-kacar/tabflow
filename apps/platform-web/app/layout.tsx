import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TabFlow Platform",
  description: "Platform administration for TabFlow"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
