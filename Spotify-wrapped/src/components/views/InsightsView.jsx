// src/components/views/InsightsView.jsx
function InsightsView({
  wrappedData,
  audioFeatures,
  getAverageAudioFeature,
  getMood,
  recentlyPlayed,
  timeRange,
}) {
  return (
    <div className="insights-grid">
      <div className="insight-card">
        <h3>🎵 Audio Features</h3>
        <div className="feature-chart">
          {["danceability", "energy", "valence", "acousticness"].map((name) => (
            <div className="feature-item" key={name}>
              <span className="feature-label">
                {name === "valence"
                  ? "Valence (Happiness)"
                  : name.charAt(0).toUpperCase() + name.slice(1)}
              </span>
              <div className="feature-bar">
                <div
                  className="feature-fill"
                  style={{
                    width: `${getAverageAudioFeature(name)}%`,
                  }}
                ></div>
              </div>
              <span className="feature-value">
                {getAverageAudioFeature(name)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="insight-card">
        <h3>{getMood().emoji} Overall Mood</h3>
        <p className="mood-description">{getMood().label}</p>
        <div className="mood-details">
          <p>Based on {Object.keys(audioFeatures).length} track analysis</p>
          <p>
            Time Range:{" "}
            {timeRange === "short_term"
              ? "4 weeks"
              : timeRange === "medium_term"
              ? "6 months"
              : "All time"}
          </p>
        </div>
      </div>

      {recentlyPlayed.length > 0 && (
        <div className="insight-card">
          <h3>🎧 Recently Played</h3>
          <div className="recent-tracks">
            {recentlyPlayed.slice(0, 5).map((item, idx) => (
              <div key={idx} className="recent-track">
                <img
                  src={item.track.album.images[2]?.url}
                  alt={item.track.name}
                  className="recent-track-image"
                />
                <div className="recent-track-info">
                  <span className="recent-track-name">{item.track.name}</span>
                  <span className="recent-track-artist">
                    {item.track.artists.map((a) => a.name).join(", ")}
                  </span>
                </div>
                <span className="recent-track-time">
                  {new Date(item.played_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="insight-card">
        <h3>📊 Popularity Distribution</h3>
        <div className="popularity-chart">
          {[
            {
              label: "High (80-100)",
              filter: (t) => t.popularity >= 80,
            },
            {
              label: "Medium (50-79)",
              filter: (t) => t.popularity >= 50 && t.popularity < 80,
            },
            {
              label: "Low (0-49)",
              filter: (t) => t.popularity < 50,
            },
          ].map((bucket) => {
            const count = wrappedData.tracks.filter(bucket.filter).length;
            const width = (count / wrappedData.tracks.length) * 100 || 0;
            return (
              <div className="chart-item" key={bucket.label}>
                <span className="chart-label">{bucket.label}</span>
                <div className="chart-bar">
                  <div
                    className="chart-fill"
                    style={{ width: `${width}%` }}
                  ></div>
                </div>
                <span className="chart-value">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default InsightsView;
