import PrivateRideHeroHeader from "./PrivateRideHeroHeader";
import PrivateRidePreviewCard from "./PrivateRidePreviewCard";
import "./PrivateRideHeroSection.css";

export default function PrivateRideHeroSection({
  badge = "PRIVATE RIDE / CARPOOL MODULE",
  title = "Travel Smarter with Private Rides",
  description = "Offer rides, search trips, choose pickup and drop points, book seats, pay securely, and manage ride details for both passengers and drivers.",

  // left card
  searchCardImage,
  searchCardEyebrow = "SEARCH RIDES",
  searchCardTitle = "Find Your Journey",
  searchCardTo = "/rides/search",

  // right card
  detailsCardImage,
  detailsCardEyebrow = "MY RIDES",
  detailsCardTitle = "View Ride Details",
  detailsCardTo = "/rides/mine",
}) {
  return (
    <section className="private-ride-hero">
      <div className="private-ride-hero__container">
        <PrivateRideHeroHeader
          badge={badge}
          title={title}
          description={description}
        />

        <div className="private-ride-hero__grid">
          <PrivateRidePreviewCard
            to={searchCardTo}
            eyebrow={searchCardEyebrow}
            title={searchCardTitle}
            imageSrc={searchCardImage}
            variant="left"
          />

          <PrivateRidePreviewCard
            to={detailsCardTo}
            eyebrow={detailsCardEyebrow}
            title={detailsCardTitle}
            imageSrc={detailsCardImage}
            variant="right"
          />
        </div>
      </div>
    </section>
  );
}