import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Singarika CMS",
  description: "Catalogue, stock and blog manager for the Singarika ethnic wear store, Nepal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
