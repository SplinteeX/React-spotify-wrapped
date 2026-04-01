// src/components/views/QuestsView.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { usePointsData } from "../../hooks/usePointsData";
import { useQuestsData } from "../../hooks/useQuestsData";

// Compute current/target for a quest from Spotify data (backend has no listening data)
function getProgressForQuest(questId, wrappedData, recentlyPlayed) {
  const recentCount = recentlyPlayed?.length ?? 0;
  const wrappedTracks = wrappedData?.tracks ?? [];
  const wrappedCount = wrappedTracks.length;
  const uniqueRecentArtists = new Set(
    (recentlyPlayed || [])
      .map((item) => item.track?.artists?.[0]?.id)
      .filter(Boolean),
  ).size;

  const map = {
    "recent-10-tracks": { current: recentCount, target: 10 },
    "recent-25-tracks": { current: recentCount, target: 25 },
    "unique-artists-5": { current: uniqueRecentArtists, target: 5 },
    "top-tracks-25": { current: wrappedCount, target: 25 },
    "top-tracks-50": { current: wrappedCount, target: 50 },
  };

  return map[questId] ?? { current: 0, target: 1 };
}

// Merge backend quest definitions with client-side progress and claim state
function mergeQuestsWithProgress(
  backendQuests,
  claimedQuestIds,
  wrappedData,
  recentlyPlayed,
  userClaimStateLoaded,
) {
  return (backendQuests || []).map((q) => {
    const { current, target } = getProgressForQuest(
      q.quest_id,
      wrappedData,
      recentlyPlayed,
    );
    const progress = target > 0 ? Math.min(current / target, 1) : 0;
    const status =
      progress >= 1 ? "completed" : current > 0 ? "in_progress" : "available";
    const claimed = claimedQuestIds.includes(q.quest_id);
    const canClaim =
      status === "completed" &&
      !claimed &&
      (userClaimStateLoaded !== false);

    return {
      id: q.quest_id,
      title: q.title ?? q.quest_id,
      description: q.description ?? "",
      period: q.period ?? "weekly",
      type: q.type ?? "listen",
      reward: Number(q.reward_points ?? 0),
      current,
      target,
      progress,
      status,
      claimable: status === "completed",
      claimed,
      canClaim,
    };
  });
}

const statusLabel = {
  available: "Available",
  in_progress: "In progress",
  completed: "Completed",
};

const statusClass = {
  available: "quest-status-available",
  in_progress: "quest-status-in-progress",
  completed: "quest-status-completed",
};

function QuestCard({ quest, onClaim, pointsLoading, claimingId, statusLabel, statusClass }) {
  return (
    <div key={quest.id} className="quest-card">
      <div className="quest-header">
        <h3 className="quest-title">{quest.title}</h3>
        <span className={`quest-status ${statusClass[quest.status]}`}>
          {statusLabel[quest.status]}
        </span>
      </div>

      <p className="quest-description">{quest.description}</p>

      <div className="quest-meta">
        <span className="quest-type">Type: {quest.type}</span>
        <span className="quest-reward">+{quest.reward} pts</span>
      </div>

      <div className="quest-progress">
        <div className="quest-progress-bar">
          <div
            className="quest-progress-fill"
            style={{ width: `${Math.round(quest.progress * 100)}%` }}
          />
        </div>
        <span className="quest-progress-label">
          {Math.round(quest.progress * 100)}% complete
        </span>
      </div>

      <div className="quest-footer">
        {quest.claimed ? (
          <div className="quest-claimed-pill">✓ Reward claimed</div>
        ) : (
          <button
            className="quest-claim-btn"
            onClick={() => onClaim(quest)}
            disabled={
              !quest.canClaim || pointsLoading || claimingId === quest.id
            }
          >
            {quest.canClaim ? "Claim points" : "Not ready yet"}
          </button>
        )}
      </div>
    </div>
  );
}

function QuestsView({ wrappedData, recentlyPlayed, isDemoMode }) {
  const userId = sessionStorage.getItem("spotify_user_id");

  const { fetchPoints } = usePointsData();
  const {
    quests: backendQuests,
    claimedQuestIds,
    loading: questsLoading,
    fetchAllQuests,
    fetchUserQuests,
    claimQuest,
  } = useQuestsData();

  const [claimingId, setClaimingId] = useState(null);
  const [demoClaimedIds, setDemoClaimedIds] = useState([]);
  const [userClaimStateLoaded, setUserClaimStateLoaded] = useState(false);
  const claimInProgressRef = useRef(false);

  const questsWithProgress = useMemo(
    () =>
      mergeQuestsWithProgress(
        backendQuests,
        isDemoMode ? demoClaimedIds : claimedQuestIds,
        wrappedData,
        recentlyPlayed,
        isDemoMode || !userId ? true : userClaimStateLoaded,
      ),
    [
      backendQuests,
      isDemoMode ? demoClaimedIds : claimedQuestIds,
      wrappedData,
      recentlyPlayed,
      isDemoMode,
      userId,
      userClaimStateLoaded,
    ],
  );

  const weeklyQuests = questsWithProgress.filter((q) => q.period === "weekly");
  const monthlyQuests = questsWithProgress.filter((q) => q.period === "monthly");
  const hasAnyProgress = questsWithProgress.some((q) => q.current > 0);

  useEffect(() => {
    fetchAllQuests().catch(() => {});
  }, [fetchAllQuests]);

  useEffect(() => {
    if (!userId || isDemoMode) return;
    fetchUserQuests(userId).catch(() => {});
  }, [userId, isDemoMode, fetchUserQuests]);

  const handleClaim = async (quest) => {
    if (!quest.canClaim) return;
    if (claimInProgressRef.current) return;

    if (isDemoMode || !userId) {
      setDemoClaimedIds((prev) =>
        prev.includes(quest.id) ? prev : [...prev, quest.id],
      );
      toast.success(`Claimed ${quest.reward} points from "${quest.title}" (demo)`, {
        toastId: `quest-claim-${quest.id}`,
      });
      return;
    }

    claimInProgressRef.current = true;
    setClaimingId(quest.id);
    const toastId = `quest-claim-${quest.id}`;
    toast.loading("Claiming quest reward...", { toastId });

    try {
      await claimQuest(userId, quest.id);
      await fetchPoints(userId);
      toast.update(toastId, {
        render: `Claimed ${quest.reward} points from "${quest.title}"`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      const alreadyClaimed = err.message?.toLowerCase().includes("already claimed");
      if (alreadyClaimed) {
        await fetchUserQuests(userId);
        await fetchPoints(userId);
        toast.update(toastId, {
          render: "This reward was already claimed.",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: err.message || "Failed to claim quest reward. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } finally {
      claimInProgressRef.current = false;
      setClaimingId(null);
    }
  };

  const showEmpty = !questsLoading && backendQuests.length === 0 && !isDemoMode;
  const showProgressEmpty = !hasAnyProgress && questsWithProgress.length > 0;

  return (
    <div className="wrapped-content quests-view">
      <div className="wrapped-section">
        <div className="section-header">
          <h2>🎯 Quests</h2>
          {isDemoMode && <span className="demo-label">Demo data</span>}
        </div>
        <p className="section-subtitle">
          Complete weekly and monthly listening quests to earn points and unlock
          badges. Progress is calculated from your recent listening and wrapped
          tracks.
        </p>

        {questsLoading && !isDemoMode && (
          <div className="quests-empty-state">
            <p>Loading quests…</p>
          </div>
        )}

        {showEmpty && (
          <div className="quests-empty-state">
            <p>No quests available right now. Try again later.</p>
          </div>
        )}

        {showProgressEmpty && !questsLoading && (
          <div className="quests-empty-state">
            <p>
              Generate your Wrapped and play some music to start making progress
              on quests.
            </p>
          </div>
        )}

        {!isDemoMode && backendQuests.length === 0 && !questsLoading ? null : (
          <>
            {weeklyQuests.length > 0 && (
              <>
                <h3 className="quests-period-title">Weekly quests</h3>
                <div className="quests-grid">
                  {weeklyQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onClaim={handleClaim}
                      pointsLoading={questsLoading}
                      claimingId={claimingId}
                      statusLabel={statusLabel}
                      statusClass={statusClass}
                    />
                  ))}
                </div>
              </>
            )}

            {monthlyQuests.length > 0 && (
              <>
                <h3 className="quests-period-title">Monthly quests</h3>
                <div className="quests-grid">
                  {monthlyQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onClaim={handleClaim}
                      pointsLoading={questsLoading}
                      claimingId={claimingId}
                      statusLabel={statusLabel}
                      statusClass={statusClass}
                    />
                  ))}
                </div>
              </>
            )}

            {isDemoMode && questsWithProgress.length === 0 && (
              <div className="quests-empty-state">
                <p>Load demo and generate Wrapped to see demo quests.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuestsView;
