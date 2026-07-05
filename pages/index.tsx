import Head from 'next/head';
import Nav from '@/components/shared/Nav';
import Footer from '@/components/shared/Footer';
import HeroSection from '@/components/hero/HeroSection';
import AboutSection from '@/components/about/AboutSection';
import ServicesSection from '@/components/services/ServicesSection';
import ProjectsSection from '@/components/projects/ProjectsSection';
import TechnologySection from '@/components/technology/TechnologySection';
import StatsSection from '@/components/stats/StatsSection';
import ContactSection from '@/components/contact/ContactSection';

export default function Home() {
  return (
    <>
      <Head>
        <title>ADHAX Enterprise — Engineering the Unbuilt</title>
      </Head>
      <Nav />
      <main className="relative bg-void">
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProjectsSection />
        <TechnologySection />
        <StatsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
