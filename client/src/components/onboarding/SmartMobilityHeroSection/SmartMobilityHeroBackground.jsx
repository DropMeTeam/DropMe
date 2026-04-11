export default function SmartMobilityHeroBackground({ imageSrc }) {
  return (
    <div
      className="smart-mobility-hero__bg"
      style={{ backgroundImage: `url(${imageSrc})` }}
      aria-hidden="true"
    />
  );
}