export default function BusHeroTitle({
  titleWhiteTop,
  titleBlueMiddle,
  titleBlueBottom,
}) {
  return (
    <h1 className="bus-hero__title">
      <span className="bus-hero__titleLine">
        <span className="white">{titleWhiteTop} </span>
        <span className="blue">{titleBlueMiddle}</span>
      </span>

      <span className="bus-hero__titleLine">
        <span className="blue">{titleBlueBottom} </span>
        <span className="white">Starts</span>
      </span>

      <span className="bus-hero__titleLine">
        <span className="white">Here</span>
      </span>
    </h1>
  );
}