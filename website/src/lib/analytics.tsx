import Script from "next/script";

export function UmamiAnalytics() {
  return (
    <Script
      defer
      src="https://umami.aleksanderbl.dk/script.js"
      data-website-id="f5cea57f-f09f-4570-a7d0-aacc41a3358a"
      strategy="afterInteractive"
    />
  );
}

