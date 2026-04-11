import SmartMobilityHeroBackground from "./SmartMobilityHeroBackground";
import SmartMobilityHeroTitle from "./SmartMobilityHeroTitle";
import SmartMobilityHeroDescription from "./SmartMobilityHeroDescription";
import SmartMobilityHeroActions from "./SmartMobilityHeroActions";
import "./SmartMobilityHeroSection.css";

export default function SmartMobilityHeroSection({
  imageSrc,
  titleLine1 = "Move Smarter",
  titleLine2 = "with DropMe",
  description = "Private rides, buses, trains, eco insights, and trusted reviews in one platform.",
  primaryText = "Get Started",
  secondaryText = "Explore Services",
  primaryTo = "/plantrip",
  secondaryTo = "/services",
}) {
  return (
    <section className="smart-mobility-hero">
      <SmartMobilityHeroBackground imageSrc={imageSrc} />

      <div className="smart-mobility-hero__content">
        <SmartMobilityHeroTitle
          titleLine1={titleLine1}
          titleLine2={titleLine2}
        />

        <SmartMobilityHeroDescription text={description} />

        <SmartMobilityHeroActions
          primaryText={primaryText}
          secondaryText={secondaryText}
          primaryTo={primaryTo}
          secondaryTo={secondaryTo}
        />
      </div>
    </section>
  );
}