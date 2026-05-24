"use client";

import { useState } from "react";
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
import { landingCopy, type LandingLanguage } from "@/lib/landing-copy";

export default function Home() {
  const [language, setLanguage] = useState<LandingLanguage>("sv");
  const copy = landingCopy[language];

  return (
    <>
      <Navbar copy={copy.nav} language={language} onLanguageChange={setLanguage} />
      <main>
        <Hero copy={copy.hero} phoneCopy={copy.phone} />
        <PainPoints copy={copy.pain} />
        <HowItWorks copy={copy.how} />
        <Features copy={copy.features} />
        <PlatformComparison copy={copy.comparison} />
        <VoiceBotDemo copy={copy.demo} />
        <Testimonials copy={copy.testimonials} />
        <Pricing copy={copy.pricing} />
        <FinalCTA copy={copy.cta} />
      </main>
      <Footer copy={copy.footer} />
    </>
  );
}
