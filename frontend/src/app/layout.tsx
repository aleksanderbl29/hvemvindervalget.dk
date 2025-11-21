import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";

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
  return (
    <html lang="da">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <Providers>
          <Theme
            accentColor="iris"
            grayColor="slate"
            panelBackground="solid"
            radius="large"
          >
            <div className="bg-amber-50 border-b-2 border-amber-300 px-8 py-6 text-center text-xl font-medium text-amber-900">
              <span className="font-bold text-2xl">Disclaimer:</span> Dette projekt er work in progress. Data på siden er falske og blot til brug i udvikling af websiden. Kom tilbage senere!
            </div>
            {children}
          </Theme>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
