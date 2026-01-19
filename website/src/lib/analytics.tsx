import Script from "next/script";
import { runtimeConfig } from "./config";

export function VercelAnalytics() {
  const isDev = process.env.NODE_ENV === "development";
  const proxyPath = runtimeConfig.analyticsProxyPath;

  const src = isDev
    ? "https://va.vercel-scripts.com/v1/script.debug.js"
    : `/${proxyPath}/analytics/script.js`;

  return (
    <>
      <Script id="analytics" strategy="afterInteractive">
        {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
      </Script>
      <Script
        async
        data-endpoint={`/${proxyPath}/analytics`}
        src={src}
        strategy="lazyOnload"
      />
    </>
  );
}

