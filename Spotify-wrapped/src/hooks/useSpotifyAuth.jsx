// src/hooks/useSpotifyAuth.jsx
import { useCallback, useEffect, useState } from "react";
import demoData from "../demoData";

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

export default function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

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

  // Handle callback + localStorage token bootstrap
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
        setIsDemoMode(false);
      }
    } else {
      const token = window.localStorage.getItem("spotify_access_token");
      if (token) {
        setAccessToken(token);
        setIsDemoMode(false);
      }
    }
  }, []);

  // Fetch profile (or demo profile)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken && !isDemoMode) return;

      if (isDemoMode) {
        setProfile(demoData.profile);
        return;
      }

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
  }, [accessToken, refreshToken, isDemoMode]);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/login`;
  };

  const handleLogout = () => {
    window.localStorage.removeItem("spotify_access_token");
    window.localStorage.removeItem("spotify_refresh_token");
    setAccessToken(null);
    setProfile(null);
    setIsDemoMode(false);
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setProfile(demoData.profile);
    setAccessToken(null);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setProfile(null);
  };

  return {
    accessToken,
    profile,
    isDemoMode,
    setProfile,
    setIsDemoMode,
    handleLogin,
    handleLogout,
    enterDemoMode,
    exitDemoMode,
    refreshToken,
    BACKEND_URL,
  };
}
