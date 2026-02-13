// src/App.jsx
import "./App.css";
import PlaylistModal from "./components/PlaylistModal";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";

import useSpotifyAuth from "./hooks/useSpotifyAuth";
import useSpotifyPlayer from "./hooks/useSpotifyPlayer";
import useWrappedData from "./hooks/useWrappedData";

export default function App() {
  // 1) Auth + profile + demo mode + tokens
  const {
    accessToken,
    profile,
    isDemoMode,
    handleLogin,
    handleLogout,
    enterDemoMode,
    exitDemoMode,
    refreshToken,
  } = useSpotifyAuth(); // encapsulates parseHash + localStorage + /api/me etc. [file:1]

  // 2) Player state + highlight playback
  const {
    playerError,
    setPlayerError,
    isHighlightPlaying,
    currentTrack,
    playbackPosition,
    highlightStartTime,
    playHighlight,
    stopPlayback,
  } = useSpotifyPlayer({
    accessToken,
    isDemoMode,
  }); // encapsulates Web Playback SDK, deviceId, isPlaying, listeners, /api/play, /api/transfer-playback. [file:1]

  // 3) Wrapped data, audio features, recently played, playlist creation
  const {
    wrappedData,
    timeRange,
    setTimeRange,
    loading,
    audioFeatures,
    recentlyPlayed,
    activeView,
    setActiveView,
    creatingPlaylist,
    playlistUrl,
    playlistCreationError,
    setPlaylistCreationError,
    generateWrapped,
    openPlaylistModal,
    showPlaylistModal,
    setShowPlaylistModal,
    createPlaylist,
    getAverageAudioFeature,
    getMood,
    getTrackFeatures,
  } = useWrappedData({
    accessToken,
    isDemoMode,
    profile,
    refreshToken,
    playerError,
    setPlayerError,
  }); // encapsulates /api/top, /api/audio-features, /api/recently-played, playlist create + demo, mood calc, etc. [file:1]

  const defaultPlaylistName = `My Spotify Wrapped - ${
    timeRange === "short_term"
      ? "4 Weeks"
      : timeRange === "medium_term"
      ? "6 Months"
      : "All Time"
  }${isDemoMode ? " (Demo)" : ""}`;

  const defaultPlaylistDescription = `Top ${
    wrappedData?.tracks.length || 50
  } tracks from my Spotify listening history. Generated with Spotify Wrapped on ${new Date().toLocaleDateString()}.`;

  // Unauthenticated view (same logic as before, but using hook handlers)
  if (!accessToken && !isDemoMode) {
    return (
      <div className="page">
        <div className="card">
          <h1>🎵 My Spotify Wrapped</h1>
          <p>
            Log in to see your personalized music insights and create playlists,
            or try the demo mode to see how it works.
          </p>
          <div className="login-options">
            <button className="button primary" onClick={handleLogin}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.601-1.559.3z" />
              </svg>
              Log in with Spotify
            </button>
            <div className="divider">
              <span>or</span>
            </div>
            <button className="button demo" onClick={enterDemoMode}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Try Demo Mode
            </button>
            <p className="demo-note">
              Demo mode shows sample data without requiring a Spotify account.
              Perfect for testing the features!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        onCreate={createPlaylist}
        defaultName={defaultPlaylistName}
        defaultDescription={defaultPlaylistDescription}
        tracks={wrappedData?.tracks || []}
        loading={creatingPlaylist}
        isDemo={isDemoMode}
      />

      <Header
        profile={profile}
        isDemoMode={isDemoMode}
        playerError={playerError}
        onLogout={isDemoMode ? exitDemoMode : handleLogout}
      />

      <Dashboard
        wrappedData={wrappedData}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        isDemoMode={isDemoMode}
        generateWrapped={generateWrapped}
        loading={loading}
        activeView={activeView}
        setActiveView={setActiveView}
        openPlaylistModal={openPlaylistModal}
        creatingPlaylist={creatingPlaylist}
        playlistUrl={playlistUrl}
        playerError={playerError}
        setPlayerError={setPlayerError}
        playlistCreationError={playlistCreationError}
        setPlaylistCreationError={setPlaylistCreationError}
        recentlyPlayed={recentlyPlayed}
        getMood={getMood}
        audioFeatures={audioFeatures}
        getAverageAudioFeature={getAverageAudioFeature}
        getTrackFeatures={getTrackFeatures}
        playHighlight={playHighlight}
        isHighlightPlaying={isHighlightPlaying}
        currentTrack={currentTrack}
        accessToken={accessToken}
      />

      {isHighlightPlaying && currentTrack && !isDemoMode && (
        <div className="player-status">
          <div className="player-status-info">
            <div className="player-status-track">
              🎵 Now Playing: {currentTrack.name}
            </div>
            <div className="player-status-detail">
              30-second highlight •{" "}
              {Math.round(
                (playbackPosition - (highlightStartTime || 0)) / 1000
              )}
              s / 30s
            </div>
          </div>
          <button className="player-status-stop" onClick={stopPlayback}>
            Stop
          </button>
        </div>
      )}

      <div style={{ display: "none" }} id="spotify-sdk-trigger"></div>
    </div>
  );
}
