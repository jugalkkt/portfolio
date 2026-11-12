import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LayerRail } from "@/components/layout/LayerRail";
import { ParticleFlow } from "@/components/canvas/ParticleFlow";
import { BootScreen } from "@/components/layout/BootScreen";
import { SiteMotion } from "@/components/motion/SiteMotion";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Experience } from "@/components/sections/Experience";
import { Education } from "@/components/sections/Education";
import { Contact } from "@/components/sections/Contact";
import { personJsonLd } from "@/content/jsonLd";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output is safe here: the data is static resume content.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <BootScreen />
      <ParticleFlow />
      <SiteMotion />
      <Header />
      <LayerRail />
      {/* Content sits above the fixed particle canvas (z-0). */}
      <div className="relative z-[1]">
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Experience />
          <Education />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}
