// hooks/useQuestsData.js
import { useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = "http://127.0.0.1:4000/user/";

export const useQuestsData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quests, setQuests] = useState([]);
  const [claimedQuestIds, setClaimedQuestIds] = useState([]);

  const fetchAllQuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${BACKEND_URL}quests`;
      const response = await axios.get(url);
      const list = Array.isArray(response.data) ? response.data : [];
      setQuests(list);
      return list;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch quests";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserQuests = useCallback(async (userId) => {
    if (!userId) {
      setError("User ID is required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}${userId}/quests`;
      const response = await axios.get(url);
      const data = response.data ?? {};
      const list = Array.isArray(data.quests) ? data.quests : [];
      const claimed = Array.isArray(data.claimedQuestIds) ? data.claimedQuestIds : [];
      setQuests(list);
      setClaimedQuestIds(claimed);
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch quests";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const claimQuest = useCallback(async (userId, questId) => {
    if (!userId || !questId) {
      setError("User ID and Quest ID are required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}${userId}/quests/${encodeURIComponent(questId)}/claim`;
      const response = await axios.post(url);
      const data = response.data;
      if (data?.claimedQuestIds) {
        setClaimedQuestIds(data.claimedQuestIds);
      }
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to claim quest";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    quests,
    claimedQuestIds,
    loading,
    error,
    fetchAllQuests,
    fetchUserQuests,
    claimQuest,
    clearError,
  };
};
