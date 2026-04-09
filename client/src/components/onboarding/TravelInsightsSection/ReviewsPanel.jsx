export default function ReviewsPanel() {
  return (
    <div className="insights-panel side-panel">
      <p className="insights-panel__label">DROPME COMMUNITY RATINGS & REVIEWS</p>

      <div className="ratings-score">
        <span className="ratings-score__main">4.8</span>
        <span className="ratings-score__sub">/ 5.0 Stars</span>
        <span className="ratings-score__stars">★★★★★</span>
      </div>

      <div className="review-card">
        <div className="review-card__top">
          <div className="avatar-circle avatar-circle--teal">J</div>

          <div className="review-card__meta">
            <div className="review-card__nameRow">
              <span className="review-card__name">Jessica R.</span>
              <span className="review-card__stars">★★★★★</span>
            </div>

            <p className="review-card__text">
              Incredible service, punctual drivers, and love seeing my eco impact!
            </p>
          </div>
        </div>

        <div className="review-card__tag">Trip Verification</div>
      </div>
    </div>
  );
}