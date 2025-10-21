import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Corporate Search Engine",
  description: "Secure Corporate Search Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
