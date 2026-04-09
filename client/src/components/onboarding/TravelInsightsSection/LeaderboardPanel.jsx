const users = [
  { rank: 1, name: "Alice M.", saved: "25,480", medal: "🥇" },
  { rank: 2, name: "Bob K.", saved: "14,352", medal: "🥈" },
  { rank: 3, name: "Charlie L.", saved: "9,860", medal: "🥉" },
];

export default function LeaderboardPanel() {
  return (
    <div className="insights-panel side-panel">
      <p className="insights-panel__label">LEADERBOARD - ECO CONTRIBUTORS</p>

      <div className="leaderboard-head">
        <span>Top User</span>
        <span>CO2 Saved (kg)</span>
      </div>

      <div className="leaderboard-list">
        {users.map((user) => (
          <div key={user.rank} className="leaderboard-row">
            <div className="leaderboard-user">
              <span className="leaderboard-rank">{user.rank}</span>
              <div className="avatar-circle">{user.name.charAt(0)}</div>
              <span className="leaderboard-name">
                {user.name} <span className="leaderboard-medal">{user.medal}</span>
              </span>
            </div>

            <span className="leaderboard-value">{user.saved}</span>
          </div>
        ))}
      </div>
    </div>
  );
}