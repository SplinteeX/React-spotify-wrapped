// src/components/views/ShopView.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { usePointsData } from "../../hooks/usePointsData";
import { useBadgesData } from "../../hooks/useBadgesData";
import { toast } from "react-toastify";

const DEFAULT_RARITY = "common";

const rarityColors = {
  common: { bg: "#4a4a4a", text: "#b3b3b3" },
  uncommon: { bg: "#2ecc71", text: "#27ae60" },
  rare: { bg: "#3498db", text: "#2980b9" },
  epic: { bg: "#9b59b6", text: "#8e44ad" },
  legendary: { bg: "#f1c40f", text: "#f39c12" },
  limited: { bg: "#e74c3c", text: "#c0392b" },
};

const categoryDefaults = {
  listener: {
    icon: "🎧",
    gradient: "linear-gradient(135deg, #6b6b6b, #8a8a8a)",
  },
  genre: { icon: "🌈", gradient: "linear-gradient(135deg, #27ae60, #2ecc71)" },
  artist: { icon: "⭐", gradient: "linear-gradient(135deg, #2980b9, #3498db)" },
  playlist: {
    icon: "📝",
    gradient: "linear-gradient(135deg, #95a5a6, #7f8c8d)",
  },
  time: { icon: "⏳", gradient: "linear-gradient(135deg, #34495e, #2c3e50)" },
  special: {
    icon: "✨",
    gradient: "linear-gradient(135deg, #1db954, #1ed760)",
  },
};

const categories = [
  { id: "all", name: "All Titles", icon: "🏷️" },
  { id: "listener", name: "Vibe Identities", icon: "🎧" },
  { id: "genre", name: "Sound Spectrum", icon: "🌈" },
  { id: "artist", name: "Resonance Icons", icon: "⭐" },
  { id: "playlist", name: "Mood Architects", icon: "📝" },
  { id: "time", name: "Eternal Echoes", icon: "⏳" },
  { id: "special", name: "Signature Editions", icon: "✨" },
];

const ShopView = ({
  userId: propUserId,
  purchasedBadges: demoPurchasedBadges = [],
  onPurchaseBadge,
  isDemoMode,
  onReturnToMain,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hasShownErrors, setHasShownErrors] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const previousErrorsRef = useRef({ badgesError: null, pointsError: null });
  const purchaseInProgressRef = useRef(false); // Synchronous guard for double-clicks

  const userId = propUserId || sessionStorage.getItem("spotify_user_id");

  const {
    points: userPoints,
    loading: pointsLoading,
    error: pointsError,
    fetchPoints,
    clearError: clearPointsError,
  } = usePointsData();

  const {
    allBadges,
    purchasedBadges: fetchedPurchasedBadges,
    loading: badgesLoading,
    error: badgesError,
    fetchAllBadges,
    fetchPurchasedBadges,
    purchaseBadge,
    clearError: clearBadgesError,
  } = useBadgesData();

  // Source of truth: backend-fetched when logged in, prop when demo
  const purchasedBadges = isDemoMode ? demoPurchasedBadges : (fetchedPurchasedBadges ?? []);

  // Errors that come from purchase flow - don't show as "Failed to load shop data"
  const isPurchaseError = (msg) =>
    msg &&
    (msg.toLowerCase().includes("already own") ||
      msg.toLowerCase().includes("insufficient points") ||
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("failed to purchase"));

  // Consolidated error handling for LOAD errors only (not purchase/transaction errors)
  useEffect(() => {
    const loadBadgesError = badgesError && !isPurchaseError(badgesError);
    const loadPointsError = pointsError && !isPurchaseError(pointsError);

    if (isDemoMode || (!loadBadgesError && !loadPointsError)) {
      setHasShownErrors(false);
      return;
    }

    const hasNewBadgesError =
      loadBadgesError && loadBadgesError !== previousErrorsRef.current.badgesError;
    const hasNewPointsError =
      loadPointsError && loadPointsError !== previousErrorsRef.current.pointsError;

    if (!hasNewBadgesError && !hasNewPointsError) {
      return;
    }

    previousErrorsRef.current = { badgesError: loadBadgesError, pointsError: loadPointsError };

    if (hasShownErrors) return;

    setHasShownErrors(true);

    const errorMessages = [];
    if (loadBadgesError) errorMessages.push(`Badges: ${loadBadgesError}`);
    if (loadPointsError) errorMessages.push(`Points: ${loadPointsError}`);

    toast.error(
      <div>
        <strong>Failed to load shop data:</strong>
        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
          {errorMessages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>,
      {
        autoClose: 5000,
        toastId: "shop-load-error", // Prevent duplicate toasts
      },
    );

    const timer = setTimeout(() => {
      if (loadBadgesError) clearBadgesError();
      if (loadPointsError) clearPointsError();
    }, 100);

    return () => clearTimeout(timer);
  }, [
    badgesError,
    pointsError,
    isDemoMode,
    clearBadgesError,
    clearPointsError,
    hasShownErrors,
  ]);

  // Fetch badges (shop inventory) with loading toast
  useEffect(() => {
    if (isDemoMode) {
      toast.info("Running in demo mode - purchases are simulated", {
        toastId: "demo-mode-notice",
        autoClose: 4000,
      });
      return;
    };

    fetchAllBadges()
      .then(() => {
        toast.dismiss(loadingToast);
      })
      .catch((e) => {
        console.error("❌ [ShopView] Failed to fetch all badges:", e.message);
        toast.update(loadingToast, {
          render: "Failed to load shop inventory",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      });
  }, [isDemoMode, fetchAllBadges]);

  // Fetch purchased badges from backend when userId is available
  useEffect(() => {
    if (!userId || isDemoMode) return;

    fetchPurchasedBadges(userId).catch((e) => {
      console.error("❌ [ShopView] Failed to fetch purchased badges:", e.message);
    });
  }, [userId, isDemoMode, fetchPurchasedBadges]);

  // Fetch points when userId is available with loading toast
  useEffect(() => {
    if (!userId || isDemoMode) return;

    fetchPoints(userId)
      .then(() => {
        toast.dismiss(loadingToast);
      })
      .catch((e) => {
        console.error("❌ [ShopView] Failed to fetch points:", e.message);
        toast.update(loadingToast, {
          render: "Failed to load your points",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      });
  }, [userId, isDemoMode, fetchPoints]);

  // Map backend badges -> UI badges
  const shopBadges = useMemo(() => {
    return (allBadges || []).map((b) => {
      const category = b.category || b.badge_category || "special";
      const rarity = b.rarity || b.badge_rarity || DEFAULT_RARITY;
      const defaults = categoryDefaults[category] || categoryDefaults.special;

      return {
        id: b.badge_id,
        name: b.name || b.badge_name || "Unnamed Badge",
        description: b.description || b.badge_description || "",
        category,
        price: Number(b.price ?? b.badge_price ?? 0),
        icon: b.icon || b.badge_icon || defaults.icon,
        rarity,
        gradient: b.gradient || b.badge_gradient || defaults.gradient,
      };
    });
  }, [allBadges]);

  const filteredBadges =
    selectedCategory === "all"
      ? shopBadges
      : shopBadges.filter((badge) => badge.category === selectedCategory);

  const displayPoints = isDemoMode ? 1250 : (userPoints ?? 0);

  const handlePurchase = async (badge) => {
    if (purchaseInProgressRef.current) return;
    purchaseInProgressRef.current = true;
    setPurchaseInProgress(true);
    if (purchasedBadges.includes(badge.id)) {
      purchaseInProgressRef.current = false;
      setPurchaseInProgress(false);
      toast.warning("You already own this badge!", {
        toastId: `owned-${badge.id}`,
      });
      return;
    }

    const pointsToUse = isDemoMode ? 1250 : (userPoints ?? 0);
    if (pointsToUse < badge.price) {
      purchaseInProgressRef.current = false;
      setPurchaseInProgress(false);
      toast.error("Not enough points!", { toastId: "insufficient-points" });
      return;
    }
    const loadingToast = toast.loading("Processing purchase...", {
      toastId: `purchase-${badge.id}`,
    });

    try {
      if (userId && !isDemoMode) {
        const res = await purchaseBadge(userId, badge.id);
        clearBadgesError(); // clear any stale error
        await fetchPoints(userId);
        if (typeof onPurchaseBadge === "function") {
          onPurchaseBadge(badge, res);
        }
      } else {
        if (typeof onPurchaseBadge === "function") {
          onPurchaseBadge(badge);
        }
      }

      toast.update(loadingToast, {
        render: `Successfully purchased ${badge.name}!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("❌ [ShopView] Purchase failed:", error.message);

      toast.update(loadingToast, {
        render:
          error.message || "Failed to process purchase. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      clearBadgesError();
    } finally {
      purchaseInProgressRef.current = false;
      setPurchaseInProgress(false);
    }
  };

  const handleRetry = () => {
    toast.dismiss();
    setHasShownErrors(false);
    previousErrorsRef.current = { badgesError: null, pointsError: null };
    clearPointsError();
    clearBadgesError();

    if (userId) {
      fetchPoints(userId).catch((e) => {
        toast.error("Failed to reload points", { toastId: "points-reload-error" });
      });
      fetchPurchasedBadges(userId).catch((e) => {
        toast.error("Failed to reload purchased badges", {
          toastId: "purchased-badges-reload-error",
        });
      });
    }

    fetchAllBadges().catch((e) => {
      toast.error("Failed to reload badges", {
        toastId: "badges-reload-error",
      });
    });
  };

  if ((pointsLoading || badgesLoading) && !isDemoMode) {
    return (
      <div className="wrapped-content">
        <div className="shop-loading-state">
          <div className="shop-loading-spinner">⏳</div>
          <h3>Loading shop...</h3>
          <p>Fetching your points and shop inventory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapped-content">
      {/* Return Button */}
      <div className="shop-return-container">
        <button
          className="shop-return-button"
          onClick={onReturnToMain}
          aria-label="Return to main view"
        >
          <span className="return-icon">←</span>
          <span className="return-text">Back to Dashboard</span>
        </button>
      </div>

      {/* Shop Header */}
      <div className="shop-header">
        <div className="shop-header-content">
          <h1>🏪 Badge Shop</h1>
          <p>
            Collect badges to show off your music journey! Earn points by
            completing quests.
          </p>
        </div>
      </div>

      {/* Points Display */}
      <div className="shop-points-card">
        <div className="shop-points-icon">💰</div>
        <div className="shop-points-info">
          <span className="shop-points-label">Your Points</span>
          <span className="shop-points-value">
            {displayPoints.toLocaleString()}
          </span>
        </div>
        <div className="shop-points-earn">
          <span>How to earn points:</span>
          <ul>
            <li>📚 Quests: Complete quests to achieve points.</li>
          </ul>
        </div>
      </div>

      {/* Retry Button (only show if there was an error) */}
      {(badgesError || pointsError) && !isDemoMode && (
        <div className="shop-retry-container">
          <button className="shop-retry-button" onClick={handleRetry}>
            🔄 Retry Loading
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="shop-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`shop-category-btn ${selectedCategory === category.id ? "active" : ""}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="shop-category-icon">{category.icon}</span>
            <span className="shop-category-name">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="shop-badges-grid">
        {filteredBadges.map((badge) => {
          const isOwned = purchasedBadges.includes(badge.id);
          const canAfford = displayPoints >= badge.price;

          return (
            <div
              key={badge.id}
              className={`shop-badge-card ${isOwned ? "owned" : ""} ${badge.rarity}`}
              style={{ background: badge.gradient }}
            >
              <div className="shop-badge-header">
                <span className="shop-badge-icon">{badge.icon}</span>
                <span
                  className="shop-badge-rarity"
                  style={{
                    background:
                      rarityColors[badge.rarity]?.bg ?? rarityColors.common.bg,
                  }}
                >
                  {badge.rarity}
                </span>
              </div>

              <div className="shop-badge-content">
                <h3 className="shop-badge-name">{badge.name}</h3>
                <p className="shop-badge-description">{badge.description}</p>

                {!isOwned && (
                  <div className="shop-badge-price">
                    <span className="price-icon">💰</span>
                    <span className="price-value">
                      {badge.price.toLocaleString()}
                    </span>
                    <span className="price-label">points</span>
                  </div>
                )}
              </div>

              <div className="shop-badge-footer">
                {isOwned ? (
                  <div className="shop-badge-owned">
                    <span>✓ Owned</span>
                    <span className="owned-badge">🏷️</span>
                  </div>
                ) : (
                  <button
                    className={`shop-badge-btn ${!canAfford ? "disabled" : ""}`}
                    onClick={() => handlePurchase(badge)}
                    disabled={!canAfford || pointsLoading || badgesLoading || purchaseInProgress}
                  >
                    {canAfford ? "Purchase" : "Not enough points"}
                  </button>
                )}
              </div>

              {isOwned && (
                <div className="shop-badge-owned-overlay">
                  <span>✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="shop-empty-state">
          <div className="shop-empty-icon">🏷️</div>
          <h3>No badges in this category</h3>
          <p>Check back later for new badges!</p>
        </div>
      )}

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="shop-demo-notice">
          <span>🔧 Demo Mode</span>
          <p>
            Points and purchases are simulated. In the real app, you'd earn
            points through quests!
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopView;
