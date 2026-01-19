import { redirect } from "next/navigation";

export default function HomePage() {
  // Keep the canonical "main space" tied to the current election route.
  // After the election, we can change this redirect to the next election slug.
  redirect("/fv26");
}
