// src/components/PlaylistModal.jsx
import { useEffect, useState } from "react";

function PlaylistModal({
  isOpen,
  onClose,
  onCreate,
  defaultName,
  defaultDescription,
  tracks,
  loading,
  isDemo = false,
}) {
  const [playlistName, setPlaylistName] = useState(defaultName);
  const [playlistDescription, setPlaylistDescription] =
    useState(defaultDescription);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setPlaylistName(defaultName);
    setPlaylistDescription(defaultDescription);
  }, [defaultName, defaultDescription]);

  useEffect(() => {
    if (isOpen && tracks && selectAll) {
      const allTrackIds = new Set(tracks.map((track) => track.id));
      setSelectedTracks(allTrackIds);
    }
  }, [isOpen, tracks, selectAll]);

  if (!isOpen) return null;

  const filteredTracks =
    tracks?.filter(
      (track) =>
        track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artists.some((artist) =>
          artist.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ) || [];

  const handleToggleTrack = (trackId) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
      setSelectAll(false);
    } else {
      newSelected.add(trackId);
      if (newSelected.size === tracks?.length) {
        setSelectAll(true);
      }
    }
    setSelectedTracks(newSelected);
  };

  const handleToggleAll = () => {
    if (selectAll) {
      setSelectedTracks(new Set());
    } else {
      const allTrackIds = new Set(tracks.map((track) => track.id));
      setSelectedTracks(allTrackIds);
    }
    setSelectAll(!selectAll);
  };

  const handleCreate = () => {
    const selectedTrackUris = tracks
      .filter((track) => selectedTracks.has(track.id))
      .map((track) => `spotify:track:${track.id}`);

    onCreate({
      name: playlistName,
      description: playlistDescription,
      isPublic,
      trackUris: selectedTrackUris,
    });
  };

  const totalTracks = tracks?.length || 0;
  const selectedCount = selectedTracks.size;

  return (
    <div className="modal-overlay">
      <div className="modal-content playlist-modal">
        <div className="modal-header">
          <h2>
            {isDemo ? "🎵 Demo Playlist Preview" : "🎵 Create Playlist"}
            {isDemo && <span className="demo-badge">DEMO</span>}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {isDemo && (
            <div className="demo-notice">
              <div className="demo-notice-icon">ℹ️</div>
              <div className="demo-notice-content">
                <strong>Demo Mode</strong>
                <p>
                  This is a preview of the playlist creation feature. In demo
                  mode, you can customize your playlist but it won't be created
                  on Spotify.
                </p>
              </div>
            </div>
          )}

          <div className="playlist-settings">
            <div className="form-group">
              <label className="form-label">Playlist Name</label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="My Spotify Wrapped Playlist"
                className="form-input"
                disabled={isDemo}
              />
              {isDemo && (
                <small className="form-hint">
                  In demo mode, playlist names are for preview only
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="My top tracks from Spotify Wrapped"
                className="form-textarea"
                rows="3"
                disabled={isDemo}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="checkbox-input"
                  disabled={isDemo}
                />
                <span>Make playlist public</span>
              </label>
            </div>

            <div className="playlist-stats">
              <div className="stat-item">
                <span className="stat-label">Total tracks:</span>
                <span className="stat-value">{totalTracks}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Selected:</span>
                <span className="stat-value">{selectedCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Duration:</span>
                <span className="stat-value">
                  {Math.round(
                    tracks?.reduce((acc, track) => acc + track.duration_ms, 0) /
                      60000
                  )}{" "}
                  min
                </span>
              </div>
            </div>
          </div>

          <div className="tracks-selection">
            <div className="selection-header">
              <h3>
                Select Tracks ({selectedCount}/{totalTracks})
                {isDemo && " (Demo Preview)"}
              </h3>
              <div className="selection-controls">
                <button
                  className="selection-toggle-btn"
                  onClick={handleToggleAll}
                  disabled={isDemo}
                >
                  {selectAll ? "Deselect All" : "Select All"}
                </button>
                <div className="search-box">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tracks..."
                    className="search-input"
                    disabled={isDemo}
                  />
                  {searchTerm && (
                    <button
                      className="search-clear"
                      onClick={() => setSearchTerm("")}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="tracks-list-container">
              {filteredTracks.length === 0 ? (
                <div className="empty-search">
                  No tracks found for "{searchTerm}"
                </div>
              ) : (
                <div className="tracks-list">
                  {filteredTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      className={`track-selection-item ${
                        selectedTracks.has(track.id) ? "selected" : ""
                      } ${isDemo ? "demo-track" : ""}`}
                      onClick={() => !isDemo && handleToggleTrack(track.id)}
                    >
                      <div className="track-select-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTracks.has(track.id)}
                          readOnly
                          className="checkbox-input"
                          disabled={isDemo}
                        />
                      </div>
                      <div className="track-rank">#{idx + 1}</div>
                      <img
                        src={
                          track.album?.images?.[2]?.url ||
                          "https://via.placeholder.com/40"
                        }
                        alt={track.album?.name}
                        className="track-selection-image"
                      />
                      <div className="track-selection-info">
                        <div className="track-selection-name">{track.name}</div>
                        <div className="track-selection-artists">
                          {track.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </div>
                      </div>
                      <div className="track-selection-meta">
                        <span className="track-album">{track.album?.name}</span>
                        <span className="track-duration">
                          {new Date(track.duration_ms)
                            .toISOString()
                            .substr(14, 5)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary" onClick={onClose}>
            {isDemo ? "Close Preview" : "Cancel"}
          </button>
          <button
            className={`modal-btn ${isDemo ? "demo" : "primary"}`}
            onClick={handleCreate}
            disabled={loading || selectedCount === 0}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {isDemo ? "Simulating..." : "Creating..."}
              </>
            ) : isDemo ? (
              `Preview Playlist (${selectedCount} tracks)`
            ) : (
              `Create Playlist (${selectedCount} tracks)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlaylistModal;
