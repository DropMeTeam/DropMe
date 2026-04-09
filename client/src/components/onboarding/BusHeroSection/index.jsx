import BusHeroBackground from "./BusHeroBackground";
import BusHeroBadge from "./BusHeroBadge";
import BusHeroTitle from "./BusHeroTitle";
import BusHeroDescription from "./BusHeroDescription";
import BusHeroActions from "./BusHeroActions";
import "./BusHeroSection.css";

export default function BusHeroSection({
  imageSrc,
  badge = "Bus Module",
  titleWhiteTop = "Smarter",
  titleBlueMiddle = "Bus",
  titleBlueBottom = "Travel",
  titleWhiteBottom = "Starts Here",
  description = "Search buses, explore routes, view schedules, check seat availability, and book your journey with a simple digital experience.",
  primaryText = "Search Buses",
  secondaryText = "View Routes",
  primaryTo = "/bus/search",
  secondaryTo = "/bus/routes",
}) {
  return (
    <section className="bus-hero">
      <BusHeroBackground imageSrc={imageSrc} />

      <div className="bus-hero__content">
        <BusHeroBadge text={badge} />

        <BusHeroTitle
          titleWhiteTop={titleWhiteTop}
          titleBlueMiddle={titleBlueMiddle}
          titleBlueBottom={titleBlueBottom}
          titleWhiteBottom={titleWhiteBottom}
        />

        <BusHeroDescription text={description} />

        <BusHeroActions
          primaryText={primaryText}
          secondaryText={secondaryText}
          primaryTo={primaryTo}
          secondaryTo={secondaryTo}
        />
      </div>
    </section>
  );
}