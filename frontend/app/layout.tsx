import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import StartupNotice from "@/components/StartupNotice";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HIRA JEWELS",
  description:
    "Discover our exquisite collection of fine jewelry across festive vibe, office wear, and wedding inspirations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
          {children}
          <StartupNotice />
          <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
