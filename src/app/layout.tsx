import type { Metadata } from "next";
import "../styles/globals.css";
import { AsyncProvider } from "@/lib/async/AsyncContext";
import { HostedThemeBridge, ToastProvider } from "@openforgelabs/rainbow-ui";

export const metadata: Metadata = {
  title: "BlueExplorer",
  description: "Azure-first infrastructure explorer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <AsyncProvider>
          <ToastProvider>
            <HostedThemeBridge allowedOrigins={[process.env.NEXT_PUBLIC_SHELL_ORIGIN ?? "http://localhost:3000"]} />
            {children}
          </ToastProvider>
        </AsyncProvider>
      </body>
    </html>
  );
}
