import BusHeroSection from "../components/onboarding/BusHeroSection";
import TrainHeroSection from "../components/onboarding/TrainHeroSection";

import busHeroImage from "../assets/onboardin/bus-hero.png";
import trainHeroImage from "../assets/onboardin/train-hero.png";

export default function OnboardingPage() {
  return (
    <div>
      <BusHeroSection
        imageSrc={busHeroImage}
        primaryTo="/bus/search"
        secondaryTo="/bus/routes"
      />

      <TrainHeroSection
        imageSrc={trainHeroImage}
        primaryTo="/train/search"
        secondaryTo="/train/routes"
      />
    </div>
  );
}