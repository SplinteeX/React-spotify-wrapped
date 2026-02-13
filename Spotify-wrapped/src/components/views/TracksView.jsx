// src/components/views/TracksView.jsx
function TracksView({
  wrappedData,
  getTrackFeatures,
  playHighlight,
  isHighlightPlaying,
  currentTrack,
  isDemoMode,
  accessToken,
}) {
  return (
    <div className="wrapped-section">
      <div className="section-header">
        <h2>All Top Tracks</h2>
        <span className="section-count">
          {wrappedData.tracks.length} tracks
        </span>
      </div>
      <div className="tracks-table full">
        <div className="table-header">
          <div className="table-cell rank">#</div>
          <div className="table-cell track">Track</div>
          <div className="table-cell album">Album</div>
          <div className="table-cell features">Audio Features</div>
          <div className="table-cell duration">Duration</div>
          <div className="table-cell popularity">Popularity</div>
          <div className="table-cell play-btn">Play</div>
        </div>
        {wrappedData.tracks.map((track, idx) => {
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
              <div className="table-cell album">{track.album?.name}</div>
              <div className="table-cell features">
                {features.danceability && (
                  <div className="audio-features">
                    <div className="feature-row">
                      <span>💃</span>
                      <div className="feature-bar">
                        <div
                          className="feature-fill"
                          style={{
                            width: `${features.danceability * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span>{Math.round(features.danceability * 100)}%</span>
                    </div>
                    <div className="feature-row">
                      <span>⚡</span>
                      <div className="feature-bar">
                        <div
                          className="feature-fill"
                          style={{
                            width: `${features.energy * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span>{Math.round(features.energy * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="table-cell duration">
                {new Date(track.duration_ms).toISOString().substr(14, 5)}
              </div>
              <div className="table-cell popularity">
                <div className="popularity-container">
                  <div className="popularity-bar small">
                    <div
                      className="popularity-fill"
                      style={{ width: `${track.popularity}%` }}
                    ></div>
                  </div>
                  <span>{track.popularity}</span>
                </div>
              </div>
              <div className="table-cell play-btn">
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
                    <>
                      <span className="playing-indicator">⏸️</span>
                      <span className="play-text">Playing</span>
                    </>
                  ) : (
                    <>
                      <span className="play-icon">▶ Play</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TracksView;
