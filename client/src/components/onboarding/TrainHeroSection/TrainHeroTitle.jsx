export default function TrainHeroTitle({
  titleWhiteTop,
  titleBlueMiddle,
  titleBlueBottom,
  titleWhiteBottom,
}) {
  return (
    <h1 className="train-hero__title">
      <span className="train-hero__titleLine">
        <span className="white">{titleWhiteTop} </span>
        <span className="blue">{titleBlueMiddle}</span>
      </span>

      <span className="train-hero__titleLine">
        <span className="blue">{titleBlueBottom} </span>
        <span className="white">{titleWhiteBottom}</span>
      </span>
    </h1>
  );
}