import { useEffect, useState, useCallback } from "react";
import "./App.css";

const BACKEND_URL = "http://127.0.0.1:4000";

function parseHash(hash) {
  if (!hash) return {};
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    expires_in: params.get("expires_in"),
  };
}

// Playlist Creation Modal Component
function PlaylistModal({
  isOpen,
  onClose,
  onCreate,
  defaultName,
  defaultDescription,
  tracks,
  loading,
}) {
  const [playlistName, setPlaylistName] = useState(defaultName);
  const [playlistDescription, setPlaylistDescription] =
    useState(defaultDescription);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
          <h2>🎵 Create Playlist</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="playlist-settings">
            <div className="form-group">
              <label className="form-label">Playlist Name</label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="My Spotify Wrapped Playlist"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="My top tracks from Spotify Wrapped"
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="checkbox-input"
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
              </h3>
              <div className="selection-controls">
                <button
                  className="selection-toggle-btn"
                  onClick={handleToggleAll}
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
                      }`}
                      onClick={() => handleToggleTrack(track.id)}
                    >
                      <div className="track-select-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedTracks.has(track.id)}
                          readOnly
                          className="checkbox-input"
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
            Cancel
          </button>
          <button
            className="modal-btn primary"
            onClick={handleCreate}
            disabled={loading || selectedCount === 0}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              `Create Playlist (${selectedCount} tracks)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wrappedData, setWrappedData] = useState(null);
  const [timeRange, setTimeRange] = useState("medium_term");
  const [loading, setLoading] = useState(false);
  const [audioFeatures, setAudioFeatures] = useState({});
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [activeView, setActiveView] = useState("overview");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistCreationError, setPlaylistCreationError] = useState(null);

  const refreshToken = useCallback(async () => {
    const refreshToken = window.localStorage.getItem("spotify_refresh_token");
    const userId = profile?.id;

    if (!refreshToken && !userId) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refresh_token: refreshToken,
          user_id: userId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.localStorage.setItem("spotify_access_token", data.access_token);
        if (data.refresh_token) {
          window.localStorage.setItem(
            "spotify_refresh_token",
            data.refresh_token
          );
        }
        setAccessToken(data.access_token);
        return data.access_token;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
    return null;
  }, [profile?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.pathname === "/callback" && window.location.hash) {
      const { access_token, refresh_token } = parseHash(window.location.hash);
      if (access_token) {
        window.localStorage.setItem("spotify_access_token", access_token);
        if (refresh_token) {
          window.localStorage.setItem("spotify_refresh_token", refresh_token);
        }
        setAccessToken(access_token);
        window.history.replaceState({}, "", "/");
      }
    } else {
      const token = window.localStorage.getItem("spotify_access_token");
      if (token) setAccessToken(token);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            const newToken = await refreshToken();
            if (newToken) {
              const retryRes = await fetch(`${BACKEND_URL}/api/me`, {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              if (retryRes.ok) {
                const data = await retryRes.json();
                setProfile(data);
              }
            }
          }
          return;
        }
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        console.error("Profile fetch error:", e);
      }
    };
    fetchProfile();
  }, [accessToken, refreshToken]);

  useEffect(() => {
    if (profile && accessToken && !wrappedData) {
      console.log("Auto-fetching wrapped data on page load");
      generateWrapped();
    }
  }, [profile, accessToken]);

  useEffect(() => {
    if (profile && accessToken && wrappedData) {
      console.log("Time range changed, regenerating wrapped data");
      generateWrapped();
    }
  }, [timeRange]);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/login`;
  };

  const handleLogout = () => {
    window.localStorage.removeItem("spotify_access_token");
    window.localStorage.removeItem("spotify_refresh_token");
    setAccessToken(null);
    setProfile(null);
    setWrappedData(null);
    setAudioFeatures({});
    setRecentlyPlayed([]);
    setPlaylistUrl(null);
    setShowPlaylistModal(false);
  };

  const openPlaylistModal = () => {
    if (!wrappedData || !accessToken || !profile) {
      alert("Please generate your Spotify Wrapped first");
      return;
    }
    setPlaylistCreationError(null);
    setShowPlaylistModal(true);
  };

  const createPlaylist = async ({ name, description, isPublic, trackUris }) => {
    setCreatingPlaylist(true);
    setPlaylistCreationError(null);

    try {
      console.log("🎵 Creating playlist:", name, trackUris.length, "tracks");

      const res = await fetch(`${BACKEND_URL}/api/create-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name,
          description: description,
          trackUris: trackUris,
          userId: profile.id,
          isPublic: isPublic,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await fetch(`${BACKEND_URL}/api/create-playlist`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                name: name,
                description: description,
                trackUris: trackUris,
                userId: profile.id,
                isPublic: isPublic,
              }),
            });

            if (retryRes.ok) {
              const data = await retryRes.json();
              handlePlaylistCreated(data);
            } else {
              handlePlaylistError(
                retryRes,
                "Failed to create playlist after token refresh"
              );
            }
          }
        } else {
          handlePlaylistError(res, "Failed to create playlist");
        }
        return;
      }

      const data = await res.json();
      handlePlaylistCreated(data);
    } catch (error) {
      console.error("Playlist creation error:", error);
      setPlaylistCreationError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handlePlaylistCreated = (data) => {
    setPlaylistUrl(data.external_urls?.spotify);
    console.log("✅ Playlist created successfully:", data);
    setShowPlaylistModal(false);

    setTimeout(() => {
      const openInSpotify = confirm(
        "🎉 Playlist created successfully!\n\nWould you like to open it in Spotify?"
      );
      if (openInSpotify) {
        window.open(data.external_urls.spotify, "_blank");
      }
    }, 300);
  };

  const handlePlaylistError = async (response, defaultMessage) => {
    try {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Failed to create playlist", errorData);

      let errorMessage = defaultMessage;

      if (errorData.message === "Insufficient client scope") {
        errorMessage =
          "🔐 The app needs additional permissions to create playlists. Please log out and log back in to grant these permissions.";
        const reAuth = confirm(errorMessage);
        if (reAuth) {
          handleLogout();
          setTimeout(() => {
            window.location.href = `${BACKEND_URL}/auth/login`;
          }, 500);
        }
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }

      setPlaylistCreationError(errorMessage);
    } catch (e) {
      setPlaylistCreationError(defaultMessage);
    }
  };

  const fetchAudioFeatures = async (trackIds) => {
    if (!trackIds.length || !accessToken) return {};

    try {
      const ids = trackIds.slice(0, 100).join(",");
      const res = await fetch(`${BACKEND_URL}/api/audio-features?ids=${ids}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("⚠️ /api/audio-features: Token invalid, refreshing...");
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await fetch(
              `${BACKEND_URL}/api/audio-features?ids=${ids}`,
              {
                headers: { Authorization: `Bearer ${newToken}` },
              }
            );
            if (retryRes.ok) {
              const data = await retryRes.json();
              const featuresMap = {};
              data.audio_features?.forEach((feature) => {
                if (feature) {
                  featuresMap[feature.id] = feature;
                }
              });
              return featuresMap;
            }
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.warn(
            `❌ /api/audio-features: Request failed with status code ${res.status}`,
            errorData
          );
        }
        return {};
      }

      const data = await res.json();
      const featuresMap = {};
      data.audio_features?.forEach((feature) => {
        if (feature) {
          featuresMap[feature.id] = feature;
        }
      });
      return featuresMap;
    } catch (error) {
      console.error("Audio features fetch error:", error);
    }
    return {};
  };

  const fetchRecentlyPlayed = async () => {
    if (!accessToken) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/recently-played?limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("⚠️ /api/recently-played: Token invalid, refreshing...");
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await fetch(
              `${BACKEND_URL}/api/recently-played?limit=10`,
              {
                headers: { Authorization: `Bearer ${newToken}` },
              }
            );
            if (retryRes.ok) {
              const data = await retryRes.json();
              setRecentlyPlayed(data.items || []);
            }
          }
        }
        return;
      }

      const data = await res.json();
      setRecentlyPlayed(data.items || []);
    } catch (error) {
      console.error("Recently played fetch error:", error);
    }
  };

  const generateWrapped = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/top?time_range=${timeRange}&limit=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await fetch(
              `${BACKEND_URL}/api/top?time_range=${timeRange}&limit=50`,
              { headers: { Authorization: `Bearer ${newToken}` } }
            );
            if (retryRes.ok) {
              const data = await retryRes.json();
              processWrappedData(data);
            }
          }
        } else {
          throw new Error("top_failed");
        }
      } else {
        const data = await res.json();
        processWrappedData(data);
      }
    } catch (e) {
      console.error("Wrapped generation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const processWrappedData = async (data) => {
    setWrappedData(data);

    const trackIds = data.tracks.map((track) => track.id);
    const features = await fetchAudioFeatures(trackIds);
    setAudioFeatures(features);

    await fetchRecentlyPlayed();
  };

  const getAverageAudioFeature = (featureName) => {
    const features = Object.values(audioFeatures);
    if (features.length === 0) return 0;

    const sum = features.reduce(
      (acc, feature) => acc + (feature[featureName] || 0),
      0
    );
    return Math.round((sum / features.length) * 100);
  };

  const getMood = () => {
    const valence = getAverageAudioFeature("valence");
    const energy = getAverageAudioFeature("energy");

    if (valence > 70 && energy > 70)
      return { emoji: "😄", label: "Happy & Energetic" };
    if (valence > 70) return { emoji: "😊", label: "Happy" };
    if (valence < 30 && energy < 30)
      return { emoji: "😔", label: "Melancholic" };
    if (valence < 30) return { emoji: "🎭", label: "Dramatic" };
    if (energy > 70) return { emoji: "⚡", label: "Energetic" };
    return { emoji: "🎵", label: "Balanced" };
  };

  const getTrackFeatures = (trackId) => {
    return audioFeatures[trackId] || {};
  };

  const defaultPlaylistName = `My Spotify Wrapped - ${
    timeRange === "short_term"
      ? "4 Weeks"
      : timeRange === "medium_term"
      ? "6 Months"
      : "All Time"
  }`;

  const defaultPlaylistDescription = `Top ${
    wrappedData?.tracks.length || 50
  } tracks from my Spotify listening history. Generated with Spotify Wrapped on ${new Date().toLocaleDateString()}.`;

  if (!accessToken) {
    return (
      <div className="page">
        <div className="card">
          <h1>🎵 My Spotify Wrapped</h1>
          <p>
            Log in to see your personalized music insights and create playlists.
          </p>
          <button className="button" onClick={handleLogin}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.601-1.559.3z" />
            </svg>
            Log in with Spotify
          </button>
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
      />

      <div className="header">
        <div className="header-left">
          <h1>🎵 My Spotify Wrapped</h1>
          <div className="user-info">
            {profile?.images?.[0] && (
              <img
                src={profile.images[0].url}
                alt={profile.display_name}
                className="user-avatar"
              />
            )}
            <div>
              <p className="user-name">{profile?.display_name}</p>
              <p className="user-details">
                {profile?.followers?.total?.toLocaleString()} followers •{" "}
                {profile?.product} • {profile?.following_count || 0} following
              </p>
            </div>
          </div>
        </div>
        <div className="header-right">
          {playlistUrl && (
            <a
              href={playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="playlist-link-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.601-1.559.3z" />
              </svg>
              View Playlist
            </a>
          )}
          <button className="logout-button" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 16L21 12M21 12L17 8M21 12H7M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Log out
          </button>
        </div>
      </div>

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
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="generate-button"
              onClick={generateWrapped}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Updating...
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
                  {wrappedData ? "Updated" : "Generate"}
                </>
              )}
            </button>
          </div>

          <div className="view-selector">
            <button
              className={`view-button ${
                activeView === "overview" ? "active" : ""
              }`}
              onClick={() => setActiveView("overview")}
            >
              Overview
            </button>
            <button
              className={`view-button ${
                activeView === "artists" ? "active" : ""
              }`}
              onClick={() => setActiveView("artists")}
            >
              Artists
            </button>
            <button
              className={`view-button ${
                activeView === "tracks" ? "active" : ""
              }`}
              onClick={() => setActiveView("tracks")}
            >
              Tracks
            </button>
            <button
              className={`view-button ${
                activeView === "insights" ? "active" : ""
              }`}
              onClick={() => setActiveView("insights")}
            >
              Insights
            </button>
            {wrappedData && (
              <button
                className="view-button create-playlist-btn"
                onClick={openPlaylistModal}
                disabled={creatingPlaylist}
                title="Create a playlist with your top tracks"
              >
                {creatingPlaylist ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
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
                    Create Playlist
                  </>
                )}
              </button>
            )}
          </div>
        </div>

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

            <div className="wrapped-content">
              {activeView === "overview" && (
                <>
                  {recentlyPlayed.length > 0 && (
                    <div className="wrapped-section">
                      <div className="section-header">
                        <h2>🎧 Recently Played</h2>
                      </div>
                      <div className="recent-tracks-grid">
                        {recentlyPlayed.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="recent-track-card">
                            <img
                              src={item.track.album.images[2]?.url}
                              alt={item.track.name}
                              className="recent-track-image"
                            />
                            <div className="recent-track-info">
                              <div className="recent-track-name">
                                {item.track.name}
                              </div>
                              <div className="recent-track-artist">
                                {item.track.artists
                                  .map((a) => a.name)
                                  .join(", ")}
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
                                artist.images?.[0]?.url ||
                                "https://via.placeholder.com/80"
                              }
                              alt={artist.name}
                              className="artist-image"
                            />
                            <div className="artist-overlay">
                              <span className="artist-followers">
                                {artist.followers?.total?.toLocaleString()}{" "}
                                followers
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
                                  {track.artists
                                    .map((artist) => artist.name)
                                    .join(", ")}
                                </span>
                              </div>
                            </div>
                            <div className="table-cell features">
                              {features.danceability && (
                                <div className="feature-indicator">
                                  <span>💃</span>
                                  <span>
                                    {Math.round(features.danceability * 100)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="table-cell duration">
                              {new Date(track.duration_ms)
                                .toISOString()
                                .substr(14, 5)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeView === "artists" && (
                <div className="wrapped-section">
                  <div className="section-header">
                    <h2>All Top Artists</h2>
                    <span className="section-count">
                      {wrappedData.artists.length} artists
                    </span>
                  </div>
                  <div className="artists-grid full">
                    {wrappedData.artists.map((artist, idx) => (
                      <div key={artist.id} className="artist-card">
                        <div className="artist-rank">{idx + 1}</div>
                        <div className="artist-image-container">
                          <img
                            src={
                              artist.images?.[0]?.url ||
                              "https://via.placeholder.com/80"
                            }
                            alt={artist.name}
                            className="artist-image"
                          />
                          <div className="artist-overlay">
                            <span className="artist-followers">
                              {artist.followers?.total?.toLocaleString()}{" "}
                              followers
                            </span>
                          </div>
                        </div>
                        <div className="artist-info">
                          <h3 className="artist-name">{artist.name}</h3>
                          <p className="artist-genres">
                            {artist.genres.slice(0, 3).join(", ")}
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
              )}

              {activeView === "tracks" && (
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
                                {track.artists
                                  .map((artist) => artist.name)
                                  .join(", ")}
                              </span>
                            </div>
                          </div>
                          <div className="table-cell album">
                            {track.album?.name}
                          </div>
                          <div className="table-cell features">
                            {features.danceability && (
                              <div className="audio-features">
                                <div className="feature-row">
                                  <span>💃</span>
                                  <div className="feature-bar">
                                    <div
                                      className="feature-fill"
                                      style={{
                                        width: `${
                                          features.danceability * 100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span>
                                    {Math.round(features.danceability * 100)}%
                                  </span>
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
                                  <span>
                                    {Math.round(features.energy * 100)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="table-cell duration">
                            {new Date(track.duration_ms)
                              .toISOString()
                              .substr(14, 5)}
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeView === "insights" && (
                <div className="insights-grid">
                  <div className="insight-card">
                    <h3>🎵 Audio Features</h3>
                    <div className="feature-chart">
                      <div className="feature-item">
                        <span className="feature-label">Danceability</span>
                        <div className="feature-bar">
                          <div
                            className="feature-fill"
                            style={{
                              width: `${getAverageAudioFeature(
                                "danceability"
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="feature-value">
                          {getAverageAudioFeature("danceability")}%
                        </span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-label">Energy</span>
                        <div className="feature-bar">
                          <div
                            className="feature-fill"
                            style={{
                              width: `${getAverageAudioFeature("energy")}%`,
                            }}
                          ></div>
                        </div>
                        <span className="feature-value">
                          {getAverageAudioFeature("energy")}%
                        </span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-label">
                          Valence (Happiness)
                        </span>
                        <div className="feature-bar">
                          <div
                            className="feature-fill"
                            style={{
                              width: `${getAverageAudioFeature("valence")}%`,
                            }}
                          ></div>
                        </div>
                        <span className="feature-value">
                          {getAverageAudioFeature("valence")}%
                        </span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-label">Acousticness</span>
                        <div className="feature-bar">
                          <div
                            className="feature-fill"
                            style={{
                              width: `${getAverageAudioFeature(
                                "acousticness"
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="feature-value">
                          {getAverageAudioFeature("acousticness")}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="insight-card">
                    <h3>{getMood().emoji} Overall Mood</h3>
                    <p className="mood-description">{getMood().label}</p>
                    <div className="mood-details">
                      <p>
                        Based on {Object.keys(audioFeatures).length} track
                        analysis
                      </p>
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
                              <span className="recent-track-name">
                                {item.track.name}
                              </span>
                              <span className="recent-track-artist">
                                {item.track.artists
                                  .map((a) => a.name)
                                  .join(", ")}
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
                      <div className="chart-item">
                        <span className="chart-label">High (80-100)</span>
                        <div className="chart-bar">
                          <div
                            className="chart-fill"
                            style={{
                              width: `${
                                (wrappedData.tracks.filter(
                                  (t) => t.popularity >= 80
                                ).length /
                                  wrappedData.tracks.length) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="chart-value">
                          {
                            wrappedData.tracks.filter((t) => t.popularity >= 80)
                              .length
                          }
                        </span>
                      </div>
                      <div className="chart-item">
                        <span className="chart-label">Medium (50-79)</span>
                        <div className="chart-bar">
                          <div
                            className="chart-fill"
                            style={{
                              width: `${
                                (wrappedData.tracks.filter(
                                  (t) => t.popularity >= 50 && t.popularity < 80
                                ).length /
                                  wrappedData.tracks.length) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="chart-value">
                          {
                            wrappedData.tracks.filter(
                              (t) => t.popularity >= 50 && t.popularity < 80
                            ).length
                          }
                        </span>
                      </div>
                      <div className="chart-item">
                        <span className="chart-label">Low (0-49)</span>
                        <div className="chart-bar">
                          <div
                            className="chart-fill"
                            style={{
                              width: `${
                                (wrappedData.tracks.filter(
                                  (t) => t.popularity < 50
                                ).length /
                                  wrappedData.tracks.length) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="chart-value">
                          {
                            wrappedData.tracks.filter((t) => t.popularity < 50)
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>Ready to generate your Spotify Wrapped?</h3>
            <p>
              Click the "Generate" button above to see your top artists and
              tracks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
