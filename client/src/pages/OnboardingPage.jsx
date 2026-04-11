import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

import BusHeroSection from "../components/onboarding/BusHeroSection";
import TrainHeroSection from "../components/onboarding/TrainHeroSection";
import SmartMobilityHeroSection from "../components/onboarding/SmartMobilityHeroSection";
import PrivateRideHeroSection from "../components/onboarding/PrivateRideHeroSection";
import TravelInsightsSection from "../components/onboarding/TravelInsightsSection";

import busHeroImage from "../assets/onboardin/bus-hero.png";
import trainHeroImage from "../assets/onboardin/train-hero.png";
import smartMobilityHeroImage from "../assets/onboardin/smart-mobility-hero.jpg";
import privateRideSearchImage from "../assets/onboardin/private-ride-search.png";
import privateRideDetailsImage from "../assets/onboardin/private-ride-details.png";

function routeByRole(role) {
  if (role === "ADMIN_TRAIN") return "/train";
  if (role === "ADMIN_BUS") return "/bus";
  if (role === "ADMIN_PRIVATE") return "/private";
  if (role === "BUS_OWNER") return "/owner";
  if (role === "driver") return "/driver";
  if (role === "rider") return "/rider";
  return "/plan";
}

export default function OnboardingPage() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={routeByRole(user.role)} replace />;
  }

  return (
    <div>
      <SmartMobilityHeroSection
        imageSrc={smartMobilityHeroImage}
        primaryTo="/login"
        secondaryTo="/login"
      />

       <PrivateRideHeroSection
        searchCardImage={privateRideSearchImage}
        detailsCardImage={privateRideDetailsImage}
        searchCardTo="/login"
        detailsCardTo="/login"
      />

       <BusHeroSection
        imageSrc={busHeroImage}
        primaryTo="/login"
        secondaryTo="/login"
      />

      <TravelInsightsSection />

        <TrainHeroSection
        imageSrc={trainHeroImage}
        primaryTo="/login"
        secondaryTo="/login"
      />
    </div>
  );
}
