import { redirect } from "next/navigation";
import { WaitingPage } from "@/components/WaitingPage";
import { runtimeConfig } from "@/lib/config";

export default function HomePage() {
  if (runtimeConfig.waitingMode) {
    return <WaitingPage />;
  }

  // Keep the canonical "main space" tied to the current election route.
  // After the election, we can change this redirect to the next election slug.
  redirect("/fv26");
}
