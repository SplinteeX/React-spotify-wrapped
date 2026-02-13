// src/components/Dashboard.jsx
import OverviewView from "./views/OverviewView";
import ArtistsView from "./views/ArtistsView";
import TracksView from "./views/TracksView";
import InsightsView from "./views/InsightsView";

function Dashboard({
  wrappedData,
  timeRange,
  setTimeRange,
  isDemoMode,
  generateWrapped,
  loading,
  activeView,
  setActiveView,
  openPlaylistModal,
  creatingPlaylist,
  playlistUrl,
  playerError,
  setPlayerError,
  playlistCreationError,
  setPlaylistCreationError,
  recentlyPlayed,
  getMood,
  audioFeatures,
  getAverageAudioFeature,
  getTrackFeatures,
  playHighlight,
  isHighlightPlaying,
  currentTrack,
  accessToken,
}) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="time-range-selector">
          <div className="time-range-group">
            <label className="time-range-label">Time Range:</label>
            <div className="time-range-buttons">
              {[
                { value: "short_term", label: "4 weeks" },
                { value: "medium_term", label: "6 months" },
                { value: "long_term", label: "All time" },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`time-range-button ${
                    timeRange === option.value ? "active" : ""
                  }`}
                  onClick={() => setTimeRange(option.value)}
                  disabled={isDemoMode}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isDemoMode && (
              <div className="demo-mode-notice">
                <span className="demo-text">
                  Time range selection is disabled in demo mode
                </span>
              </div>
            )}
          </div>
          <button
            className={`generate-button ${isDemoMode ? "demo" : ""}`}
            onClick={generateWrapped}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {isDemoMode ? "Loading Demo..." : "Updating..."}
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 6V12L16 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {wrappedData
                  ? isDemoMode
                    ? "Demo Ready"
                    : "Updated"
                  : isDemoMode
                  ? "Load Demo"
                  : "Generate"}
              </>
            )}
          </button>
        </div>

        <div className="view-selector">
          {["overview", "artists", "tracks", "insights"].map((view) => (
            <button
              key={view}
              className={`view-button ${activeView === view ? "active" : ""}`}
              onClick={() => setActiveView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}

          {wrappedData && (
            <button
              className={`view-button create-playlist-btn ${
                isDemoMode ? "demo" : ""
              }`}
              onClick={openPlaylistModal}
              disabled={creatingPlaylist}
              title={
                isDemoMode
                  ? "Preview playlist creation with demo data"
                  : "Create a playlist with your top tracks"
              }
            >
              {creatingPlaylist ? (
                <>
                  <span className="spinner"></span>
                  {isDemoMode ? "Previewing..." : "Creating..."}
                </>
              ) : playlistUrl ? (
                <>✓ Playlist Created</>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  {isDemoMode ? "Preview Playlist" : "Create Playlist"}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {playerError && (
        <div className="error-message player-error-message">
          <span>⚠️ {playerError}</span>
          <button onClick={() => setPlayerError(null)}>×</button>
        </div>
      )}

      {playlistCreationError && (
        <div className="error-message">
          <span>⚠️ {playlistCreationError}</span>
          <button onClick={() => setPlaylistCreationError(null)}>×</button>
        </div>
      )}

      {wrappedData ? (
        <>
          <div className="stats-overview">
            <div className="stat-card">
              <span className="stat-value">{wrappedData.artists.length}</span>
              <span className="stat-label">Top Artists</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{wrappedData.tracks.length}</span>
              <span className="stat-label">Top Tracks</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {wrappedData.artists
                  .slice(0, 3)
                  .map((a) => a.genres[0])
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(", ")}
              </span>
              <span className="stat-label">Top Genres</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{getMood().emoji}</span>
              <span className="stat-label">Mood</span>
            </div>
          </div>

          {activeView === "overview" && (
            <OverviewView
              wrappedData={wrappedData}
              recentlyPlayed={recentlyPlayed}
              isDemoMode={isDemoMode}
              getTrackFeatures={getTrackFeatures}
              playHighlight={playHighlight}
              isHighlightPlaying={isHighlightPlaying}
              currentTrack={currentTrack}
              accessToken={accessToken}
            />
          )}

          {activeView === "artists" && (
            <ArtistsView wrappedData={wrappedData} />
          )}

          {activeView === "tracks" && (
            <TracksView
              wrappedData={wrappedData}
              getTrackFeatures={getTrackFeatures}
              playHighlight={playHighlight}
              isHighlightPlaying={isHighlightPlaying}
              currentTrack={currentTrack}
              isDemoMode={isDemoMode}
              accessToken={accessToken}
            />
          )}

          {activeView === "insights" && (
            <InsightsView
              wrappedData={wrappedData}
              audioFeatures={audioFeatures}
              getAverageAudioFeature={getAverageAudioFeature}
              getMood={getMood}
              recentlyPlayed={recentlyPlayed}
              timeRange={timeRange}
            />
          )}
        </>
      ) : (
        <div className="empty-state">
          <h3>
            {isDemoMode
              ? "Ready to explore demo data?"
              : "Ready to generate your Spotify Wrapped?"}
          </h3>
          <p>
            {isDemoMode
              ? "Click the 'Load Demo' button above to see sample wrapped data."
              : "Click the 'Generate' button above to see your top artists and tracks."}
          </p>
          {isDemoMode && (
            <div className="demo-features">
              <p className="demo-features-title">Demo features include:</p>
              <ul className="demo-features-list">
                <li>🎵 Sample top artists and tracks</li>
                <li>📊 Audio features analysis</li>
                <li>🎧 Recently played tracks</li>
                <li>🔄 Playlist creation preview</li>
                <li>📈 Mood and popularity insights</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
