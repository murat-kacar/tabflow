import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yenicafe",
  description: "QR menu and tenant admin for Yenicafe"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
