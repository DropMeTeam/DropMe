import BusHeroSection from "../components/onboarding/BusHeroSection";
import TrainHeroSection from "../components/onboarding/TrainHeroSection";

import busHeroImage from "../assets/onboardin/bus-hero.png";
import trainHeroImage from "../assets/onboardin/train-hero.png";

import SmartMobilityHeroSection from "../components/onboarding/SmartMobilityHeroSection";
import smartMobilityHeroImage from "../assets/onboardin/smart-mobility-hero.jpg";

import PrivateRideHeroSection from "../components/onboarding/PrivateRideHeroSection";
import privateRideSearchImage from "../assets/onboardin/private-ride-search.png";
import privateRideDetailsImage from "../assets/onboardin/private-ride-details.png";

import TravelInsightsSection from "../components/onboarding/TravelInsightsSection";


export default function OnboardingPage() {
  return (
    <div>
     

      
      <SmartMobilityHeroSection
        imageSrc={smartMobilityHeroImage}
        primaryTo="/plantrip"
        secondaryTo="/services"
      />

       <PrivateRideHeroSection
        searchCardImage={privateRideSearchImage}
        detailsCardImage={privateRideDetailsImage}
        searchCardTo="/rides/search"
        detailsCardTo="/rides/mine"
      />

       <BusHeroSection
        imageSrc={busHeroImage}
        primaryTo="/bus/search"
        secondaryTo="/bus/routes"
      />

      <TravelInsightsSection />

        <TrainHeroSection
        imageSrc={trainHeroImage}
        primaryTo="/train/search"
        secondaryTo="/train/routes"
      />


    </div>

     
  );
}