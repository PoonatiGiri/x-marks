import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "X-marks — Your bookmarks, on a canvas",
  description: "Explore your Twitter bookmarks on an infinite canvas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${geist.className} h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
