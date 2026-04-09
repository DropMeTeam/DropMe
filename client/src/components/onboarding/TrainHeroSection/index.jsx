import TrainHeroBackground from "./TrainHeroBackground";
import TrainHeroBadge from "./TrainHeroBadge";
import TrainHeroTitle from "./TrainHeroTitle";
import TrainHeroDescription from "./TrainHeroDescription";
import TrainHeroActions from "./TrainHeroActions";
import "./TrainHeroSection.css";

export default function TrainHeroSection({
  imageSrc,
  badge = "Train Module",
  titleWhiteTop = "Smarter",
  titleBlueMiddle = "Train",
  titleBlueBottom = "Travel",
  titleWhiteBottom = "Starts Here",
  description = "Search trains, explore routes, view schedules, check seat availability, and book your journey with a simple digital experience.",
  primaryText = "Search Trains",
  secondaryText = "View Routes",
  primaryTo = "/train/search",
  secondaryTo = "/train/routes",
}) {
  return (
    <section className="train-hero">
      <TrainHeroBackground imageSrc={imageSrc} />

      <div className="train-hero__content">
        <TrainHeroBadge text={badge} />

        <TrainHeroTitle
          titleWhiteTop={titleWhiteTop}
          titleBlueMiddle={titleBlueMiddle}
          titleBlueBottom={titleBlueBottom}
          titleWhiteBottom={titleWhiteBottom}
        />

        <TrainHeroDescription text={description} />

        <TrainHeroActions
          primaryText={primaryText}
          secondaryText={secondaryText}
          primaryTo={primaryTo}
          secondaryTo={secondaryTo}
        />
      </div>
    </section>
  );
}