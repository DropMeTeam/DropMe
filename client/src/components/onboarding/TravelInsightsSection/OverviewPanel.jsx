export default function OverviewPanel() {
  return (
    <div className="insights-panel insights-panel--overview">
      <p className="insights-panel__label">DROPME INSIGHTS OVERVIEW</p>

      <div className="insights-metrics">
        <div className="metric-card metric-card--primary">
          <div className="metric-card__top">
            <div className="metric-card__icon">🍃</div>
            <span className="metric-card__tag">Trend ↗</span>
          </div>

          <div className="metric-card__label">CO2 SAVED</div>

          <div className="metric-card__valueRow">
            <span className="metric-card__value">25,480</span>
            <span className="metric-card__unit">kg</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">TOTAL RIDES</div>

          <div className="metric-card__valueRow">
            <span className="metric-card__value">14,352</span>
            <span className="metric-card__unit">Trips</span>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card__title">CO2 Savings Trend - Last 30 Days</div>

        <div className="chart-card__svgWrap">
          <svg
            viewBox="0 0 760 320"
            className="chart-card__svg"
            aria-label="CO2 savings trend chart"
            role="img"
          >
            <defs>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#42ddff" />
                <stop offset="100%" stopColor="#67f0ff" />
              </linearGradient>

              <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(80, 236, 255, 0.28)" />
                <stop offset="100%" stopColor="rgba(80, 236, 255, 0.02)" />
              </linearGradient>
            </defs>

            <line x1="40" y1="40" x2="720" y2="40" className="chart-grid" />
            <line x1="40" y1="95" x2="720" y2="95" className="chart-grid" />
            <line x1="40" y1="150" x2="720" y2="150" className="chart-grid" />
            <line x1="40" y1="205" x2="720" y2="205" className="chart-grid" />
            <line x1="40" y1="260" x2="720" y2="260" className="chart-grid" />

            <path
              d="M40 260
                 C90 220, 120 205, 160 195
                 C200 185, 240 185, 280 205
                 C320 225, 350 150, 390 160
                 C430 170, 455 210, 500 185
                 C545 160, 580 170, 610 120
                 C640 75, 675 235, 720 105
                 L720 290 L40 290 Z"
              fill="url(#areaGlow)"
            />

            <path
              d="M40 260
                 C90 220, 120 205, 160 195
                 C200 185, 240 185, 280 205
                 C320 225, 350 150, 390 160
                 C430 170, 455 210, 500 185
                 C545 160, 580 170, 610 120
                 C640 75, 675 235, 720 105"
              fill="none"
              stroke="url(#lineGlow)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <circle cx="350" cy="150" r="11" className="chart-point" />
            <circle cx="610" cy="120" r="11" className="chart-point" />

            <text x="30" y="265" className="chart-axisText">0</text>
            <text x="18" y="210" className="chart-axisText">200</text>
            <text x="18" y="155" className="chart-axisText">400</text>
            <text x="18" y="100" className="chart-axisText">600</text>
            <text x="18" y="45" className="chart-axisText">800</text>

            <text x="35" y="314" className="chart-axisText">Mar 1</text>
            <text x="165" y="314" className="chart-axisText">Jul 3</text>
            <text x="292" y="314" className="chart-axisText">Jan 5</text>
            <text x="470" y="314" className="chart-axisText">Jul 7</text>
            <text x="590" y="314" className="chart-axisText">Jul 19</text>
            <text x="680" y="314" className="chart-axisText">Jul 30</text>
          </svg>
        </div>
      </div>
    </div>
  );
}