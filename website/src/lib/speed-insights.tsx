import Script from "next/script";
import { runtimeConfig } from "./config";

export function VercelSpeedInsights() {
  const isDev = process.env.NODE_ENV === "development";
  const proxyPath = runtimeConfig.analyticsProxyPath;

  const src = isDev
    ? "https://va.vercel-scripts.com/v1/speed-insights/script.debug.js"
    : `/${proxyPath}/speed/script.js`;

  return (
    <>
      <Script id="web-vitals" strategy="afterInteractive">
        {`window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };`}
      </Script>
      <Script
        async
        data-endpoint={`/${proxyPath}/speed/vitals`}
        src={src}
        strategy="lazyOnload"
      />
    </>
  );
}

