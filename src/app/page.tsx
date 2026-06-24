import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Footer } from "@/components/landing/Footer";

export default async function LandingPage() {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/dashboard");

  return (
    <main>
      <LandingNav />
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <Footer />
    </main>
  );
}
