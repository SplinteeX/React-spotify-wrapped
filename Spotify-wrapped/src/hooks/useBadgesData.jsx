// hooks/useBadgesData.jsx
import { useState, useCallback, useMemo } from "react";
import axios from "axios";

const BACKEND_URL = "http://127.0.0.1:4000/user/";

export const useBadgesData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [allBadges, setAllBadges] = useState([]);
  const [purchasedBadges, setPurchasedBadges] = useState([]);
  const [lastPurchaseResult, setLastPurchaseResult] = useState(null);

  // fetch all badges
  const fetchAllBadges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}badges`;
      console.log("[useBadgesData] GET", url);

      const response = await axios.get(url);
      console.log("[useBadgesData] all badges response.data:", response.data);

      // Controller might return { badges: [...] } or just [...]
      const badges = Array.isArray(response.data)
        ? response.data
        : response.data?.badges ?? [];

      setAllBadges(badges);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch badges";

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPurchasedBadges = useCallback(async (userId) => {
    if (!userId) {
      setError("User ID is required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}${userId}/badges`;
      console.log("[useBadgesData] GET", url);

      const response = await axios.get(url);
      console.log("[useBadgesData] response.data:", response.data);

      // API returns { userId, purchasedBadges }
      const badges = response.data?.purchasedBadges ?? [];
      setPurchasedBadges(badges);

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch purchased badges";

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const purchaseBadge = useCallback(async (userId, badgeId) => {
    if (!userId) {
      setError("User ID is required");
      return null;
    }
    if (!badgeId) {
      setError("Badge ID is required");
      return null;
    }

    setLoading(true);
    setError(null);
    setLastPurchaseResult(null);

    try {
      const url = `${BACKEND_URL}${userId}/badges/purchase`;
      console.log("[useBadgesData] POST", url, { badgeId });

      const response = await axios.post(url, { badgeId });
      console.log("[useBadgesData] purchase response:", response.data);

      if (response.data?.success) {
        if (response.data?.purchasedBadges) {
          setPurchasedBadges(response.data.purchasedBadges);
        } else if (response.data?.badgeId) {
          setPurchasedBadges((prev) =>
            prev.includes(response.data.badgeId) ? prev : [...prev, response.data.badgeId],
          );
        }

        setLastPurchaseResult({
          success: true,
          badgeId: response.data.badgeId || badgeId,
          newTotal: response.data.newTotal,
          // NOTE: your backend returns `price` (not pointsSpent)
          pointsSpent: response.data.price,
        });
      }

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to purchase badge";

      setError(errorMessage);
      setLastPurchaseResult({ success: false, error: errorMessage });

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasBadge = useCallback(
    (badgeId) => purchasedBadges.includes(badgeId),
    [purchasedBadges],
  );

  const getPurchasedBadgesCount = useCallback(
    () => purchasedBadges.length,
    [purchasedBadges],
  );

  const getBadgeById = useCallback(
    (badgeId) => allBadges.find((b) => b.badge_id === badgeId) || null,
    [allBadges],
  );

  // derived list of owned badge objects
  const ownedBadges = useMemo(() => {
    const owned = new Set(purchasedBadges);
    return allBadges.filter((b) => owned.has(b.badge_id));
  }, [allBadges, purchasedBadges]);

  const clearError = useCallback(() => setError(null), []);

  const resetBadges = useCallback(() => {
    setAllBadges([]);     
    setPurchasedBadges([]);
    setError(null);
    setLastPurchaseResult(null);
  }, []);

  const refreshBadges = useCallback(
    async (userId) => await fetchPurchasedBadges(userId),
    [fetchPurchasedBadges],
  );

  // refresh for all badges
  const refreshAllBadges = useCallback(
    async () => await fetchAllBadges(),
    [fetchAllBadges],
  );

  return {
    // States
    allBadges,
    ownedBadges,
    purchasedBadges,
    loading,
    error,
    lastPurchaseResult,

    // Core operations
    fetchAllBadges,
    fetchPurchasedBadges,
    purchaseBadge,

    // Utilities
    hasBadge,
    getBadgeById, 
    getPurchasedBadgesCount,
    clearError,
    resetBadges,
    refreshBadges,
    refreshAllBadges,
  };
};