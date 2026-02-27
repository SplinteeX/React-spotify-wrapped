// src/components/views/ShopView.jsx
import { useState, useEffect } from "react";
import { usePointsData } from "../../hooks/usePointsData";

const ShopView = ({
  userId: propUserId,
  purchasedBadges = [],
  onPurchaseBadge,
  isDemoMode,
  onReturnToMain, // Add this prop
}) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);

  // Get userId from props or sessionStorage (set by useSpotifyAuth)
  const userId = propUserId || sessionStorage.getItem("spotify_user_id");

  console.log("🎯 [ShopView] Mounted with:", {
    propUserId,
    sessionUserId: sessionStorage.getItem("spotify_user_id"),
    effectiveUserId: userId,
    isDemoMode,
    purchasedBadgesCount: purchasedBadges.length,
    timestamp: new Date().toISOString(),
  });

  const {
    points: userPoints,
    loading: pointsLoading,
    error: pointsError,
    fetchPoints,
    deductPoints,
    clearError,
  } = usePointsData();

  // Log points data whenever it changes
  useEffect(() => {
    console.log("💰 [ShopView] Points data updated:", {
      userPoints,
      pointsLoading,
      pointsError,
      isDemoMode,
      effectiveUserId: userId,
      timestamp: new Date().toISOString(),
    });
  }, [userPoints, pointsLoading, pointsError, isDemoMode, userId]);

  // Fetch points when userId is available
  useEffect(() => {
    console.log("🔄 [ShopView] Fetch effect running:", {
      userId,
      isDemoMode,
      shouldFetch: !!(userId && !isDemoMode),
      timestamp: new Date().toISOString(),
    });

    if (userId && !isDemoMode) {
      console.log(
        "📡 [ShopView] Making API call to fetch points for user:",
        userId,
      );
      fetchPoints(userId)
        .then((result) => {
          console.log(result);
          console.log("✅ [ShopView] Points fetched successfully:", {
            userId,
            points: result?.points,
            result,
          });
        })
        .catch((error) => {
          console.error("❌ [ShopView] Failed to fetch points:", {
            userId,
            error: error.message,
            stack: error.stack,
          });
        });
    } else if (isDemoMode) {
      console.log(
        "🎮 [ShopView] Demo mode active, using simulated points (1250)",
      );
    } else {
      console.log(
        "⚠️ [ShopView] No userId available, points will not be fetched",
      );
    }
  }, [userId, isDemoMode, fetchPoints]);

  // Badge definitions
  const badges = [
    // Listener Badges
    {
      id: "neon-listener",
      name: "Neon Listener",
      description: "A fresh pulse in a world of sound.",
      category: "listener",
      price: 0,
      icon: "🎧",
      rarity: "common",
      gradient: "linear-gradient(135deg, #6b6b6b, #8a8a8a)",
    },
    {
      id: "echo-walker",
      name: "Echo Walker",
      description: "Moving through life one rhythm at a time.",
      category: "listener",
      price: 50,
      icon: "📅",
      rarity: "common",
      gradient: "linear-gradient(135deg, #4a90e2, #357abd)",
    },
    {
      id: "midnight-aura",
      name: "Midnight Aura",
      description: "Where the bass glows under city lights.",
      category: "listener",
      price: 75,
      icon: "🦉",
      rarity: "uncommon",
      gradient: "linear-gradient(135deg, #6f4e37, #4a3729)",
    },
    {
      id: "golden-frequency",
      name: "Golden Frequency",
      description: "Bright tones wrapped in sunrise energy.",
      category: "listener",
      price: 75,
      icon: "🐦",
      rarity: "uncommon",
      gradient: "linear-gradient(135deg, #f7b731, #f39c12)",
    },

    // Genre Collection
    {
      id: "spectrum-rider",
      name: "Spectrum Rider",
      description: "Flowing across waves of every color and sound.",
      category: "genre",
      price: 100,
      icon: "🌍",
      rarity: "common",
      gradient: "linear-gradient(135deg, #27ae60, #2ecc71)",
    },
    {
      id: "harmony-architect",
      name: "Harmony Architect",
      description: "Built from layers of rhythm and resonance.",
      category: "genre",
      price: 200,
      icon: "🎪",
      rarity: "rare",
      gradient: "linear-gradient(135deg, #8e44ad, #9b59b6)",
    },
    {
      id: "prism-legend",
      name: "Prism Legend",
      description: "A radiant blend of every sonic dimension.",
      category: "genre",
      price: 500,
      icon: "🏆",
      rarity: "epic",
      gradient: "linear-gradient(135deg, #f1c40f, #f39c12)",
    },

    // Artist Collection
    {
      id: "starlight-echo",
      name: "Starlight Echo",
      description: "Where spotlight and sound collide.",
      category: "artist",
      price: 150,
      icon: "⭐",
      rarity: "rare",
      gradient: "linear-gradient(135deg, #e67e22, #d35400)",
    },
    {
      id: "vinyl-vault",
      name: "Vinyl Vault",
      description: "Timeless tones stored in endless rotation.",
      category: "artist",
      price: 125,
      icon: "📚",
      rarity: "uncommon",
      gradient: "linear-gradient(135deg, #16a085, #1abc9c)",
    },
    {
      id: "aurora-seeker",
      name: "Aurora Seeker",
      description: "Chasing rare waves across the horizon.",
      category: "artist",
      price: 150,
      icon: "🔍",
      rarity: "rare",
      gradient: "linear-gradient(135deg, #2980b9, #3498db)",
    },

    // Playlist Collection
    {
      id: "mood-alchemist",
      name: "Mood Alchemist",
      description: "Turning emotion into atmosphere.",
      category: "playlist",
      price: 25,
      icon: "📝",
      rarity: "common",
      gradient: "linear-gradient(135deg, #95a5a6, #7f8c8d)",
    },
    {
      id: "sonic-architect",
      name: "Sonic Architect",
      description: "Designed with precision and pulse.",
      category: "playlist",
      price: 150,
      icon: "🎵",
      rarity: "uncommon",
      gradient: "linear-gradient(135deg, #e74c3c, #c0392b)",
    },
    {
      id: "wave-monarch",
      name: "Wave Monarch",
      description: "Crowned in rhythm and resonance.",
      category: "playlist",
      price: 300,
      icon: "📈",
      rarity: "epic",
      gradient: "linear-gradient(135deg, #d35400, #e67e22)",
    },

    // Time Collection
    {
      id: "pulse-keeper",
      name: "Pulse Keeper",
      description: "Steady beats. Endless motion.",
      category: "time",
      price: 100,
      icon: "⏰",
      rarity: "common",
      gradient: "linear-gradient(135deg, #34495e, #2c3e50)",
    },
    {
      id: "eternal-frequency",
      name: "Eternal Frequency",
      description: "Sound without limits.",
      category: "time",
      price: 400,
      icon: "⌛",
      rarity: "rare",
      gradient: "linear-gradient(135deg, #f39c12, #e67e22)",
    },
    {
      id: "timeless-resonance",
      name: "Timeless Resonance",
      description: "Echoing beyond eras.",
      category: "time",
      price: 250,
      icon: "🎂",
      rarity: "rare",
      gradient: "linear-gradient(135deg, #9b59b6, #8e44ad)",
    },

    // Special Collection
    {
      id: "prismatic-pulse",
      name: "Prismatic Pulse",
      description: "A celebration of color and sound.",
      category: "special",
      price: 50,
      icon: "🎁",
      rarity: "limited",
      gradient: "linear-gradient(135deg, #1db954, #1ed760)",
    },
    {
      id: "velvet-frequency",
      name: "Velvet Frequency",
      description: "Smooth waves wrapped in glow.",
      category: "special",
      price: 50,
      icon: "🎄",
      rarity: "limited",
      gradient: "linear-gradient(135deg, #ff6b6b, #ff8e8e)",
    },
    {
      id: "first-wave",
      name: "First Wave",
      description: "Where the sound era began.",
      category: "special",
      price: 500,
      icon: "🚀",
      rarity: "legendary",
      gradient: "linear-gradient(135deg, #f1c40f, #e67e22, #e74c3c)",
    },
    {
      id: "stage-phantom",
      name: "Stage Phantom",
      description: "Living between lights and echoes.",
      category: "special",
      price: 200,
      icon: "🎫",
      rarity: "epic",
      gradient: "linear-gradient(135deg, #e84393, #c2185b)",
    },
  ];

  const categories = [
    { id: "all", name: "All Titles", icon: "🏷️" },
    { id: "listener", name: "Vibe Identities", icon: "🎧" },
    { id: "genre", name: "Sound Spectrum", icon: "🌈" },
    { id: "artist", name: "Resonance Icons", icon: "⭐" },
    { id: "playlist", name: "Mood Architects", icon: "📝" },
    { id: "time", name: "Eternal Echoes", icon: "⏳" },
    { id: "special", name: "Signature Editions", icon: "✨" },
  ];

  const rarityColors = {
    common: { bg: "#4a4a4a", text: "#b3b3b3" },
    uncommon: { bg: "#2ecc71", text: "#27ae60" },
    rare: { bg: "#3498db", text: "#2980b9" },
    epic: { bg: "#9b59b6", text: "#8e44ad" },
    legendary: { bg: "#f1c40f", text: "#f39c12" },
    limited: { bg: "#e74c3c", text: "#c0392b" },
  };

  const filteredBadges =
    selectedCategory === "all"
      ? badges
      : badges.filter((badge) => badge.category === selectedCategory);

  const handlePurchase = async (badge) => {
    console.log("🛒 [ShopView] Purchase attempt:", {
      badgeId: badge.id,
      badgeName: badge.name,
      badgePrice: badge.price,
      userPoints: userPoints,
      isDemoMode,
      userId,
      purchasedBadges: purchasedBadges,
      timestamp: new Date().toISOString(),
    });

    if (purchasedBadges.includes(badge.id)) {
      console.log("❌ [ShopView] Purchase failed: Badge already owned", {
        badgeId: badge.id,
      });
      setPurchaseError("You already own this badge!");
      setTimeout(() => setPurchaseError(null), 3000);
      return;
    }

    const pointsToUse = isDemoMode ? 1250 : (userPoints ?? 0);

    if (pointsToUse < badge.price) {
      console.log("❌ [ShopView] Purchase failed: Insufficient points", {
        hasPoints: pointsToUse,
        neededPoints: badge.price,
        shortBy: badge.price - pointsToUse,
      });
      setPurchaseError("Not enough points!");
      setTimeout(() => setPurchaseError(null), 3000);
      return;
    }

    try {
      console.log("💳 [ShopView] Processing purchase:", {
        userId,
        badgeId: badge.id,
        price: badge.price,
        pointsBefore: pointsToUse,
        pointsAfter: pointsToUse - badge.price,
      });

      // Deduct points from database if not in demo mode
      if (userId && !isDemoMode) {
        console.log("📡 [ShopView] Calling deductPoints API:", {
          userId,
          points: badge.price,
          reason: `purchased_badge_${badge.id}`,
        });
        const deductResult = await deductPoints(
          userId,
          badge.price,
          `purchased_badge_${badge.id}`,
        );
        console.log(
          "✅ [ShopView] Points deducted successfully:",
          deductResult,
        );
      } else {
        console.log("🎮 [ShopView] Demo mode: Simulating points deduction");
      }

      // Call the parent handler to update purchased badges
      console.log("📞 [ShopView] Calling onPurchaseBadge callback");
      onPurchaseBadge(badge);

      // Refresh points to get updated balance
      if (userId && !isDemoMode) {
        console.log("🔄 [ShopView] Refreshing points after purchase");
        await fetchPoints(userId);
      }

      console.log("✅ [ShopView] Purchase successful!", {
        badgeName: badge.name,
        newPoints: pointsToUse - badge.price,
      });

      setPurchaseSuccess(`Successfully purchased ${badge.name}!`);
      setTimeout(() => setPurchaseSuccess(null), 3000);
    } catch (error) {
      console.error("❌ [ShopView] Purchase failed with error:", {
        error: error.message,
        stack: error.stack,
        userId,
        badgeId: badge.id,
      });
      setPurchaseError("Failed to process purchase. Please try again.");
      setTimeout(() => setPurchaseError(null), 3000);
    }
  };

  // Log when component renders
  console.log("🖼️ [ShopView] Rendering with state:", {
    selectedCategory,
    purchaseSuccess,
    purchaseError,
    displayPoints: isDemoMode ? 1250 : userPoints,
    pointsLoading,
    pointsError,
    filteredBadgesCount: filteredBadges.length,
    isDemoMode,
    timestamp: new Date().toISOString(),
  });

  // Show loading state
  if (pointsLoading && !isDemoMode) {
    console.log("⏳ [ShopView] Showing loading state");
    return (
      <div className="wrapped-content">
        <div className="shop-loading-state">
          <div className="shop-loading-spinner">⏳</div>
          <h3>Loading shop...</h3>
          <p>Fetching your points and purchases</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (pointsError && !isDemoMode) {
    console.log("❌ [ShopView] Showing error state:", pointsError);
    return (
      <div className="wrapped-content">
        <div className="shop-error-state">
          <div className="shop-error-icon">❌</div>
          <h3>Failed to load points</h3>
          <p>{pointsError}</p>
          <button
            className="shop-retry-button"
            onClick={() => {
              console.log(
                "🔄 [ShopView] Retry button clicked, clearing error and refetching",
              );
              clearError();
              if (userId) fetchPoints(userId);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Demo mode points
  const displayPoints = isDemoMode ? 1250 : (userPoints ?? 0);

  return (
    <div className="wrapped-content">
      {/* Return Button - Positioned at the top */}
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

      {/* Notifications */}
      {purchaseSuccess && (
        <div className="shop-notification success">
          <span>✅ {purchaseSuccess}</span>
        </div>
      )}
      {purchaseError && (
        <div className="shop-notification error">
          <span>❌ {purchaseError}</span>
        </div>
      )}

      {/* Category Filter */}
      <div className="shop-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`shop-category-btn ${selectedCategory === category.id ? "active" : ""}`}
            onClick={() => {
              console.log("📁 [ShopView] Category changed to:", category.name);
              setSelectedCategory(category.id);
            }}
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
                  style={{ background: rarityColors[badge.rarity].bg }}
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
                    disabled={!canAfford || pointsLoading}
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
