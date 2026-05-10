import type { Metadata, Viewport } from "next";
import { Manrope, Onest, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeManager } from "@/components/ThemeManager";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-onest",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "СОШ №57 · Расписание",
  description:
    "Умный центр расписания МАОУ СОШ №57 г. Калининград — современный интерфейс, живой таймлайн дня и быстрый поиск по урокам.",
  applicationName: "СОШ №57 Schedule",
};

export const viewport: Viewport = {
  themeColor: "#04060d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 2,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${onest.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeManager />
        {/* Animated aurora background — three soft drifting blobs */}
        <div aria-hidden className="aurora-bg">
          <span />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
