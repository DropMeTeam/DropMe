export default function TrainHeroBadge({ text }) {
  return (
    <div className="train-hero__badge">
      <span className="train-hero__badgeIcon">🚆</span>
      <span>{text}</span>
    </div>
  );
}