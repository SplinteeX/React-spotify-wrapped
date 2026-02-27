// hooks/usePointsData.jsx
import { useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = "http://127.0.0.1:4000/user/";

export const usePointsData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState(null);

  const fetchPoints = useCallback(async (userId) => {
    if (!userId) {
      setError("User ID is required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}${userId}/points`;
      console.log("[usePointsData] GET", url);

      const response = await axios.get(url);
      console.log("[usePointsData] response.data:", response.data);

      // your controller returns { userId, points }
      setPoints(response.data?.points ?? 0);

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch points";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPoints = useCallback(async (userId, pointsToAdd, reason = "") => {
    if (!userId) {
      setError("User ID is required");
      return null;
    }

    if (typeof pointsToAdd !== "number" || pointsToAdd <= 0) {
      setError("Valid positive number of points is required");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}${userId}/addPoints`;
      console.log("[usePointsData] POST", url, { pointsToAdd, reason });

      const response = await axios.post(url, {
        points: pointsToAdd,
        reason: reason || "manual_add",
      });

      // Your controller likely returns newTotal (or points). Support both.
      const newTotal =
        response.data?.newTotal ??
        response.data?.points ??
        response.data?.total ??
        null;

      if (typeof newTotal === "number") setPoints(newTotal);

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to add points";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deductPoints = useCallback(
    async (userId, pointsToDeduct, reason = "") => {
      if (!userId) {
        setError("User ID is required");
        return null;
      }

      if (typeof pointsToDeduct !== "number" || pointsToDeduct <= 0) {
        setError("Valid positive number of points is required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `${BACKEND_URL}${userId}/deductPoints`;
        console.log("[usePointsData] POST", url, { pointsToDeduct, reason });

        const response = await axios.post(url, {
          points: pointsToDeduct,
          reason: reason || "manual_deduct",
        });

        const newTotal =
          response.data?.newTotal ??
          response.data?.points ??
          response.data?.total ??
          null;

        if (typeof newTotal === "number") setPoints(newTotal);

        return response.data;
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to deduct points";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  const resetPoints = useCallback(() => {
    setPoints(null);
    setError(null);
  }, []);

  return {
    points,
    loading,
    error,
    fetchPoints,
    addPoints,
    deductPoints,
    clearError,
    resetPoints,
  };
};
