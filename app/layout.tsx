import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Booklet App",
  description:
    "Upload a PDF and export a print-ready booklet layout in Korean or English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
