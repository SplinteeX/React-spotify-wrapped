// src/components/views/OverviewView.jsx
function OverviewView({
  wrappedData,
  recentlyPlayed,
  isDemoMode,
  getTrackFeatures,
  playHighlight,
  isHighlightPlaying,
  currentTrack,
  accessToken,
}) {
  return (
    <div className="wrapped-content">
      {recentlyPlayed.length > 0 && (
        <div className="wrapped-section">
          <div className="section-header">
            <h2>🎧 Recently Played</h2>
            {isDemoMode && <span className="demo-label">Demo Data</span>}
          </div>
          <div className="recent-tracks-grid">
            {recentlyPlayed.slice(0, 5).map((item, idx) => (
              <div key={idx} className="recent-track-card">
                <img
                  src={item.track.album.images[0]?.url}
                  alt={item.track.name}
                  className="recent-track-image"
                />
                <div className="recent-track-info">
                  <div className="recent-track-name">{item.track.name}</div>
                  <div className="recent-track-artist">
                    {item.track.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wrapped-section">
        <div className="section-header">
          <h2>Top Artists</h2>
          <span className="section-count">
            {wrappedData.artists.length} artists
          </span>
        </div>
        <div className="artists-grid">
          {wrappedData.artists.slice(0, 6).map((artist, idx) => (
            <div key={artist.id} className="artist-card">
              <div className="artist-rank">{idx + 1}</div>
              <div className="artist-image-container">
                <img
                  src={
                    artist.images?.[0]?.url || "https://via.placeholder.com/80"
                  }
                  alt={artist.name}
                  className="artist-image"
                />
                <div className="artist-overlay">
                  <span className="artist-followers">
                    {artist.followers?.total?.toLocaleString()} followers
                  </span>
                </div>
              </div>
              <div className="artist-info">
                <h3 className="artist-name">{artist.name}</h3>
                <p className="artist-genres">
                  {artist.genres.slice(0, 2).join(", ")}
                </p>
                <div className="artist-popularity">
                  <div className="popularity-bar">
                    <div
                      className="popularity-fill"
                      style={{ width: `${artist.popularity}%` }}
                    ></div>
                  </div>
                  <span className="popularity-score">
                    {artist.popularity}/100
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wrapped-section">
        <div className="section-header">
          <h2>Top Tracks</h2>
          <span className="section-count">
            {wrappedData.tracks.length} tracks
          </span>
        </div>
        <div className="tracks-table compact">
          {wrappedData.tracks.slice(0, 10).map((track, idx) => {
            const features = getTrackFeatures(track.id);
            return (
              <div key={track.id} className="table-row">
                <div className="table-cell rank">
                  <span className="rank-number">{idx + 1}</span>
                </div>
                <div className="table-cell track">
                  <img
                    src={
                      track.album?.images?.[2]?.url ||
                      "https://via.placeholder.com/40"
                    }
                    alt={track.album?.name}
                    className="track-image"
                  />
                  <div className="track-info">
                    <span className="track-name">{track.name}</span>
                    <span className="track-artists">
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </span>
                  </div>
                </div>
                <div className="table-cell features">
                  <button
                    className="highlight-play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      playHighlight(
                        `spotify:track:${track.id}`,
                        track.duration_ms
                      );
                    }}
                    disabled={isDemoMode || !accessToken}
                    title="Play 30-second highlight"
                  >
                    {isHighlightPlaying && currentTrack?.id === track.id ? (
                      <span className="playing-indicator">Stop</span>
                    ) : (
                      "▶ Play"
                    )}
                  </button>
                </div>
                <div className="table-cell duration">
                  {new Date(track.duration_ms).toISOString().substr(14, 5)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OverviewView;
