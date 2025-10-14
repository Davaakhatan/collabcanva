import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToCursors, type CursorsMap } from "../services/cursor";

export interface OnlineUser {
  userId: string;
  displayName: string;
  color: string;
}

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCursors((allCursors: CursorsMap) => {
      // Convert cursors map to array of online users
      const users = Object.entries(allCursors).map(([userId, data]) => ({
        userId,
        displayName: data.displayName,
        color: data.cursorColor,
      }));

      setOnlineUsers(users);
    });

    return unsubscribe;
  }, [user]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
  };
}

