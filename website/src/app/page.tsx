import { WaitingPage } from "@/components/WaitingPage";
import { ModelLandingPage } from "@/components/pages/ModelLandingPage";
import { runtimeConfig } from "@/lib/config";

export const runtime = "nodejs";

export default async function HomePage() {
  if (runtimeConfig.waitingMode) {
    return <WaitingPage />;
  }

  return <ModelLandingPage />;
}
