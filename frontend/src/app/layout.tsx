import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ClientStoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Omnimax Planner",
  description: "Financial planning for advisers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>
          <ClientStoreProvider>{children}</ClientStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
