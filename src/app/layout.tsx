import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";
import { hasDatabaseConfig } from "@/lib/db";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TamaDex — Tamagotchi Collection & Wiki",
  description: "Manage your Tamagotchi collection and explore the wiki database",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  if (hasDatabaseConfig()) {
    try {
      session = await auth();
    } catch (error) {
      console.error("Auth session error:", error);
    }
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Navbar user={session?.user} />
          <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-0">{children}</main>
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
