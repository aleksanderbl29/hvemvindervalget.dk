import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "./globals.css";
import { Providers } from "./providers";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { VercelAnalytics } from "@/lib/analytics";
import { VercelSpeedInsights } from "@/lib/speed-insights";

const montserrat = Montserrat({
  subsets: ["latin"],
});

const currentElection = {
  name: "Folketingsvalg 2026",
  slug: "fv26",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hvemvindervalget.dk"),
  title: {
    default: `Hvem vinder valget? | ${currentElection.name}`,
    template: `Hvem vinder valget? | ${currentElection.name}`,
  },
  description:
    `Prognoser og analyser for ${currentElection.name}.`,
  authors: [{ name: "Aleksander Bang-Larsen" }],
  openGraph: {
    title: `Hvem vinder valget? | ${currentElection.name}`,
    description:
      `Prognoser og analyser for ${currentElection.name}.`,
    url: "https://www.hvemvindervalget.dk",
    siteName: "Hvem vinder valget?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Hvem vinder valget? | ${currentElection.name}`,
    description:
      `Prognoser og analyser for ${currentElection.name}.`,
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
    <html lang="da" className={montserrat.className}>
      <body className="antialiased bg-slate-50 text-slate-900">
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
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  );
}
