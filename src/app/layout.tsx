import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Project Stairway - Voting & Production Ledger",
  description: "Democratic studio voting and task pipeline ledger"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="container" style={{ display: "flex", gap: "16px", minHeight: "85vh", alignItems: "stretch" }}>
            <Sidebar />
            <main style={{ flex: 1, minWidth: 0 }}>
              {children}
            </main>
          </div>
          <footer style={{ marginTop: "16px", fontSize: "11px", color: "#666", textAlign: "center" }}>
            Project Stairway &copy; 2026
          </footer>
        </Providers>
      </body>
    </html>
  );
}
