import type { Metadata } from "next";
import { Providers } from "./providers";
import { displayFont, monoFont, uiFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freja AI | AI Voice Ordering for Nordic Pizza Restaurants",
  description: "Freja AI answers every phone call, takes multilingual pizza orders, and sends clean tickets to the kitchen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${uiFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
