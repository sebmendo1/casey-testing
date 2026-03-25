import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casey | Home Lending",
  description: "Casey — your digital home lending assistant for loans, affordability, and property search.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-[100dvh] flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
