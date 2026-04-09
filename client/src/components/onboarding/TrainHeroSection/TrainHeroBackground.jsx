export default function TrainHeroBackground({ imageSrc }) {
  return (
    <>
      <div
        className="train-hero__bg"
        style={{ backgroundImage: `url(${imageSrc})` }}
        aria-hidden="true"
      />
      <div className="train-hero__overlay" aria-hidden="true" />
      <div className="train-hero__leftFade" aria-hidden="true" />
    </>
  );
}