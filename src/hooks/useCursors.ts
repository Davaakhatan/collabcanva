import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  updateCursorPosition,
  setUserOnline,
  subscribeToCursors,
  type CursorsMap,
} from "../services/cursor";
import { generateUserColor, getDisplayName } from "../utils/helpers";
import { CURSOR_UPDATE_THROTTLE } from "../utils/constants";
import { throttle } from "../utils/helpers";

export function useCursors() {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<CursorsMap>({});
  const userColorRef = useRef<string | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize user presence and get color
  useEffect(() => {
    if (!user) return;

    const userId = (user as any).uid;
    if (!userId) return;

    // Generate consistent color for this user
    if (!userColorRef.current) {
      userColorRef.current = generateUserColor(userId);
    }

    const displayName = getDisplayName(user);

    // Set user as online
    setUserOnline(userId, displayName, userColorRef.current).catch((err) => {
      console.error("Failed to set user online:", err);
    });

    // Subscribe to all cursors
    const unsubscribe = subscribeToCursors((allCursors) => {
      // Filter out current user's cursor
      const otherCursors = { ...allCursors };
      delete otherCursors[userId];
      setCursors(otherCursors);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Throttled cursor position update
  const updateCursor = useCallback(
    throttle((x: number, y: number) => {
      if (!user) return;

      const userId = (user as any).uid;
      if (!userId || !userColorRef.current) return;

      // Only update if position changed significantly (>2px)
      const dx = Math.abs(x - lastPositionRef.current.x);
      const dy = Math.abs(y - lastPositionRef.current.y);

      if (dx < 2 && dy < 2) return;

      lastPositionRef.current = { x, y };

      const displayName = getDisplayName(user);

      updateCursorPosition(
        userId,
        x,
        y,
        displayName,
        userColorRef.current
      ).catch((err) => {
        console.error("Failed to update cursor:", err);
      });
    }, CURSOR_UPDATE_THROTTLE),
    [user]
  );

  return {
    cursors,
    updateCursor,
    userColor: userColorRef.current,
  };
}

