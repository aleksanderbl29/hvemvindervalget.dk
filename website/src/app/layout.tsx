import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "./globals.css";
import { Providers } from "./providers";
import { WaitingPage } from "@/components/WaitingPage";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { runtimeConfig } from "@/lib/config";
import { VercelAnalytics } from "@/lib/analytics";
import { VercelSpeedInsights } from "@/lib/speed-insights";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hvemvindervalget.dk"),
  title: {
    default: "Hvem vinder valget? | Kommunalvalg 2025",
    template: "%s | Hvem vinder valget?",
  },
  description:
    "Prognoser og analyser for kommunalvalget 2025. Sitet er under udvikling.",
  authors: [{ name: "Aleksander Bang-Larsen" }],
  openGraph: {
    title: "Hvem vinder valget?",
    description:
      "Prognoser og analyser for kommunalvalget 2025. Sitet er under udvikling.",
    url: "https://www.hvemvindervalget.dk",
    siteName: "Hvem vinder valget?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hvem vinder valget?",
    description:
      "Prognoser og analyser for kommunalvalget 2025. Sitet er under udvikling.",
  },
};

export const viewport: Viewport = {
  themeColor: "#06162b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isWaitingMode = runtimeConfig.waitingMode;

  return (
    <html lang="da">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        {isWaitingMode ? (
          <WaitingPage />
        ) : (
          <Providers>
            <Theme
              accentColor="iris"
              grayColor="slate"
              panelBackground="solid"
              radius="large"
            >
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <div className="flex-1">{children}</div>
                <SiteFooter />
              </div>
            </Theme>
          </Providers>
        )}
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  );
}
