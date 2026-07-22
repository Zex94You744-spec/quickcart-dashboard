import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuickCart - Smart Telegram Order Management for Shops",
  description: "Automate your shop orders with Telegram bot. Get PDF invoices, live tracking, and advanced analytics. Perfect for kirana, medical, and retail stores.",
  keywords: "telegram bot, order management, shop automation, PDF invoices, QuickCart",
  authors: [{ name: "QuickCart Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 👇 RAZORPAY SDK ADDED HERE 👇 */}
        <script 
          src="https://checkout.razorpay.com/v1/checkout.js" 
          defer
        ></script>
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Theme Color for Mobile */}
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
