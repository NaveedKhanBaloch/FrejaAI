import { DashboardPreview } from "@/components/sections/DashboardPreview";
import { Features } from "@/components/sections/Features";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PainPoints } from "@/components/sections/PainPoints";
import { PlatformComparison } from "@/components/sections/PlatformComparison";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { VoiceBotDemo } from "@/components/sections/VoiceBotDemo";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <HowItWorks />
        <Features />
        <PlatformComparison />
        <VoiceBotDemo />
        <DashboardPreview />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
