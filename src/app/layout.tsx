import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Singarika CMS",
  description: "Content and catalogue manager for the Singarika ethnic wear store",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
