import React, { useState, useEffect } from 'react';
import type { BaseListMenu } from '../types';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import BenefitsSection from '../components/sections/BenefitsSection';
import CtaSection from '../components/sections/CtaSection';
import Footer from '../components/layout/Footer';
import LoadingScreen from '../components/common/LoadingScreen';


interface LandingPageProps {
  listMenuUser?: BaseListMenu[];
}

const LandingPage: React.FC<LandingPageProps> = ({ listMenuUser = [] }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading completion after 500ms
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer); // Cleanup the timer
  }, []);

  if (loading) {
    return <LoadingScreen setLoading={setLoading} />; // Render the LoadingScreen while loading
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar listMenuUser={listMenuUser} />
      <HeroSection listMenuUser={listMenuUser} />
      <FeaturesSection />
      <BenefitsSection />
      <CtaSection listMenuUser={listMenuUser} />
      <Footer listMenuUser={listMenuUser} />
    </div>
  );
};

export default LandingPage;