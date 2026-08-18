import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amul Availability Monitor | Live Stock Alerts",
  description: "Automated stock monitor for Amul High Protein products with instant email alerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090d16] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
