import InsightsHeader from "./InsightsHeader";
import OverviewPanel from "./OverviewPanel";
import LeaderboardPanel from "./LeaderboardPanel";
import ReviewsPanel from "./ReviewsPanel";
import "./TravelInsightsSection.css";

export default function TravelInsightsSection() {
  return (
    <section className="travel-insights">
      <div className="travel-insights__container">
        <InsightsHeader
          badge="Analytics • Ratings • Reviews"
          title="Travel Insights That Matter"
          description="Track CO2 savings, view leaderboard insights, and explore ratings and reviews that build trust across the DropMe platform."
        />

        <div className="travel-insights__grid">
          <OverviewPanel />

          <div className="travel-insights__side">
            <LeaderboardPanel />
            <ReviewsPanel />
          </div>
        </div>
      </div>

      <div className="travel-insights__line travel-insights__line--left" />
      <div className="travel-insights__line travel-insights__line--right" />
      <div className="travel-insights__spark" />
    </section>
  );
}