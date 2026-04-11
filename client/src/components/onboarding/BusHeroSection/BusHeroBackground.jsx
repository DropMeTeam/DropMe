export default function BusHeroBackground({ imageSrc }) {
  return (
    <>
      <div
        className="bus-hero__bg"
        style={{ backgroundImage: `url(${imageSrc})` }}
        aria-hidden="true"
      />
      <div className="bus-hero__overlay" aria-hidden="true" />
      <div className="bus-hero__leftFade" aria-hidden="true" />
    </>
  );
}