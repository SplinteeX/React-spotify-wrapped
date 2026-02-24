import { useEffect, useState, useRef } from "react";

export default function useSpotifyPlayer({
  accessToken,
  isDemoMode,
  BACKEND_URL = "http://127.0.0.1:4000",
}) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [highlightStartTime, setHighlightStartTime] = useState(null);
  const [isHighlightPlaying, setIsHighlightPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  const playerRef = useRef(null);

  // Initialize Web Playback SDK (runs only when token changes)
  useEffect(() => {
    if (!accessToken || isDemoMode) return;

    let mounted = true;

    const initializePlayer = () => {
      if (!window.Spotify) {
        setTimeout(initializePlayer, 100);
        return;
      }

      const newPlayer = new window.Spotify.Player({
        name: "Spotify Wrapped Player",
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      newPlayer.addListener("initialization_error", ({ message }) => {
        console.error("Initialization Error:", message);
        setPlayerError(message);
      });

      newPlayer.addListener("authentication_error", ({ message }) => {
        console.error("Authentication Error:", message);
        setPlayerError(message);
      });

      newPlayer.addListener("account_error", () => {
        setPlayerError(
          "Premium account required for playback. Please upgrade to Spotify Premium."
        );
      });

      newPlayer.addListener("playback_error", ({ message }) => {
        console.error("Playback Error:", message);
        setPlayerError(message);
      });

      newPlayer.addListener("player_state_changed", async (state) => {
        if (!state) return;

        const { position, track_window, paused } = state;

        setPlaybackPosition(position);

        if (track_window?.current_track) {
          setCurrentTrack(track_window.current_track);
          setIsPlaying(!paused);
        }

        // Stop highlight after 30 seconds
        if (
          highlightStartTime !== null &&
          position >= highlightStartTime + 30000
        ) {
          await newPlayer.pause();
          setIsHighlightPlaying(false);
          setHighlightStartTime(null);
        }
      });

      newPlayer.addListener("ready", ({ device_id }) => {
        console.log("Spotify Player Ready:", device_id);
        setDeviceId(device_id);
        setPlayerError(null);
      });

      newPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device went offline:", device_id);
        setDeviceId(null);
      });

      newPlayer.connect();

      if (mounted) {
        playerRef.current = newPlayer;
        setPlayer(newPlayer);
      }
    };

    window.onSpotifyWebPlaybackSDKReady = initializePlayer;

    if (window.Spotify) {
      initializePlayer();
    }

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [accessToken, isDemoMode]);

  // Play 30s highlight
  const playHighlight = async (trackUri, trackDuration) => {
    if (isDemoMode) {
      alert(
        "🎵 Demo Mode: In a real session, this would play a 30-second highlight."
      );
      return;
    }

    if (!accessToken) {
      alert("Please log in with Spotify.");
      return;
    }

    if (!deviceId) {
      setPlayerError("Player not ready yet. Please wait and try again.");
      setTimeout(() => setPlayerError(null), 5000);
      return;
    }

    try {
      const highlightStart = Math.max(0, (trackDuration - 30000) / 2);

      await fetch(`${BACKEND_URL}/api/transfer-playback`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      const playResponse = await fetch(`${BACKEND_URL}/api/play`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: deviceId,
          uris: [trackUri],
          position_ms: Math.floor(highlightStart),
        }),
      });

      if (!playResponse.ok) {
        const errorData = await playResponse.json();
        throw new Error(errorData.error || "Failed to start playback");
      }

      setHighlightStartTime(highlightStart);
      setIsHighlightPlaying(true);
      setPlayerError(null);
    } catch (error) {
      console.error("Play highlight error:", error);

      let errorMessage = "Failed to play highlight. ";

      if (error.message.includes("Premium")) {
        errorMessage += "Spotify Premium required.";
      } else if (error.message.includes("device")) {
        errorMessage += "Player device not ready.";
      } else {
        errorMessage += error.message;
      }

      setPlayerError(errorMessage);
      setTimeout(() => setPlayerError(null), 5000);
    }
  };

  const stopPlayback = async () => {
    if (!playerRef.current) return;

    try {
      await playerRef.current.pause();
      setIsPlaying(false);
      setIsHighlightPlaying(false);
      setHighlightStartTime(null);
      setCurrentTrack(null);
    } catch (error) {
      console.error("Stop playback error:", error);
    }
  };

  return {
    playerError,
    setPlayerError,
    isPlaying,
    currentTrack,
    playbackPosition,
    highlightStartTime,
    isHighlightPlaying,
    playHighlight,
    stopPlayback,
  };
}