import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Booklet",
  description: "Drop a PDF and download a booklet-ready PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
