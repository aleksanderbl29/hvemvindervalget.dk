import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "./globals.css";
import { Providers } from "./providers";
import { WaitingPage } from "@/components/WaitingPage";
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
    "Dashboard med bayesianske prognoser, scenarier og polls for kommunalvalget 2025.",
  authors: [{ name: "Aleksander Bang-Larsen" }],
  openGraph: {
    title: "Hvem vinder valget?",
    description:
      "Opdaterede prognoser, polls og scenarieanalyser for kommunalvalget 2025.",
    url: "https://www.hvemvindervalget.dk",
    siteName: "Hvem vinder valget?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hvem vinder valget?",
    description:
      "Opdaterede prognoser, polls og scenarieanalyser for kommunalvalget 2025.",
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
              {children}
            </Theme>
          </Providers>
        )}
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  );
}
