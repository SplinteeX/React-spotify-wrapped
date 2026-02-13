// src/hooks/useWrappedData.jsx
import { useEffect, useState } from "react";
import demoData from "../demoData";

const BACKEND_URL = "http://127.0.0.1:4000";

export default function useWrappedData({
  accessToken,
  isDemoMode,
  profile,
  refreshToken,
}) {
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

  // Auto-generate on initial profile load
  useEffect(() => {
    if (
      (profile && accessToken && !wrappedData) ||
      (isDemoMode && profile && !wrappedData)
    ) {
      generateWrapped();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, accessToken, isDemoMode]);

  // Regenerate on timeRange change
  useEffect(() => {
    if (
      (profile && accessToken && wrappedData) ||
      (isDemoMode && profile && wrappedData)
    ) {
      generateWrapped();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, isDemoMode]);

  const openPlaylistModal = () => {
    if (!wrappedData || !profile) {
      alert("Please generate your Spotify Wrapped first");
      return;
    }
    setPlaylistCreationError(null);
    setShowPlaylistModal(true);
  };

  const handlePlaylistCreated = (data) => {
    setPlaylistUrl(data.external_urls?.spotify);
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

      let errorMessage = defaultMessage;

      if (errorData.message === "Insufficient client scope") {
        errorMessage =
          "🔐 The app needs additional permissions to create playlists. Please log out and log back in to grant these permissions.";
        const reAuth = confirm(errorMessage);
        if (reAuth) {
          window.localStorage.removeItem("spotify_access_token");
          window.localStorage.removeItem("spotify_refresh_token");
          window.location.href = `${BACKEND_URL}/auth/login`;
        }
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }

      setPlaylistCreationError(errorMessage);
    } catch (e) {
      setPlaylistCreationError(defaultMessage);
    }
  };

  const createPlaylist = async ({ name, description, isPublic, trackUris }) => {
    if (isDemoMode) {
      setCreatingPlaylist(true);
      setTimeout(() => {
        setCreatingPlaylist(false);
        setShowPlaylistModal(false);
        alert(
          `🎉 Demo Playlist Created!\n\nName: ${name}\nDescription: ${description}\nTracks: ${trackUris.length}\n\nIn a real session, this would create a playlist on Spotify.`
        );
      }, 1500);
      return;
    }

    if (!accessToken || !profile) return;

    setCreatingPlaylist(true);
    setPlaylistCreationError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/create-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          description,
          trackUris,
          userId: profile.id,
          isPublic,
        }),
      });

      if (!res.ok) {
        if (res.status === 401 && refreshToken) {
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await fetch(`${BACKEND_URL}/api/create-playlist`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                name,
                description,
                trackUris,
                userId: profile.id,
                isPublic,
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

  const fetchAudioFeatures = async (trackIds) => {
    if (isDemoMode) {
      const featuresMap = {};
      trackIds.forEach((id) => {
        if (demoData.wrapped.audio_features[id]) {
          featuresMap[id] = demoData.wrapped.audio_features[id];
        }
      });
      return featuresMap;
    }

    if (!trackIds.length || !accessToken) return {};

    try {
      const ids = trackIds.slice(0, 100).join(",");
      const url = `${BACKEND_URL}/api/audio-features?ids=${encodeURIComponent(
        ids
      )}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        // optional: handle 401 with refreshToken like you already do
        return {};
      }

      const data = await res.json(); // { audio_features: [...] }
      const featuresMap = {};

      data.audio_features?.forEach((feature) => {
        if (feature) {
          featuresMap[feature.id] = feature;
        }
      });

      return featuresMap;
    } catch (error) {
      console.error("Audio features fetch error:", error);
      return {};
    }
  };

  const fetchRecentlyPlayed = async () => {
    if (isDemoMode) {
      setRecentlyPlayed(demoData.wrapped.recently_played);
      return;
    }

    if (!accessToken) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/recently-played?limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401 && refreshToken) {
          const newToken = await refreshToken();
          if (newToken) {
            const retryRes = await fetch(
              `${BACKEND_URL}/api/recently-played?limit=10`,
              { headers: { Authorization: `Bearer ${newToken}` } }
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

  const processWrappedData = async (data) => {
    setWrappedData(data);

    const trackIds = data.tracks.map((track) => track.id);
    const features = await fetchAudioFeatures(trackIds);
    setAudioFeatures(features);

    await fetchRecentlyPlayed();
  };

  const generateWrapped = async () => {
    if (isDemoMode) {
      setLoading(true);
      setTimeout(() => {
        const demoWrappedData = {
          artists: demoData.wrapped.artists,
          tracks: demoData.wrapped.tracks,
          meta: {
            time_range: timeRange,
            total_artists: demoData.wrapped.artists.length,
            total_tracks: demoData.wrapped.tracks.length,
            limit: 50,
            generated_at: new Date().toISOString(),
          },
        };
        setWrappedData(demoWrappedData);
        setAudioFeatures(demoData.wrapped.audio_features);
        setRecentlyPlayed(demoData.wrapped.recently_played);
        setLoading(false);
      }, 1000);
      return;
    }

    if (!accessToken) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/top?time_range=${timeRange}&limit=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        if (res.status === 401 && refreshToken) {
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

  const getTrackFeatures = (trackId) => audioFeatures[trackId] || {};

  return {
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
  };
}
