import { ref, set, onValue, onDisconnect, off } from "firebase/database";
import { rtdb } from "./firebase";

const CANVAS_ID = "global-canvas-v1";

export interface CursorData {
  displayName: string;
  cursorColor: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number;
}

export type CursorsMap = Record<string, CursorData>;

/**
 * Update user's cursor position in Realtime Database
 */
export async function updateCursorPosition(
  userId: string,
  x: number,
  y: number,
  displayName: string,
  cursorColor: string
): Promise<void> {
  const cursorRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
  
  await set(cursorRef, {
    displayName,
    cursorColor,
    cursorX: x,
    cursorY: y,
    lastSeen: Date.now(),
  });
}

/**
 * Set user as online and setup auto-cleanup on disconnect
 */
export async function setUserOnline(
  userId: string,
  displayName: string,
  cursorColor: string
): Promise<void> {
  const userRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
  
  // Set initial presence
  await set(userRef, {
    displayName,
    cursorColor,
    cursorX: 0,
    cursorY: 0,
    lastSeen: Date.now(),
  });
  
  // Auto-cleanup on disconnect
  onDisconnect(userRef).remove();
}

/**
 * Subscribe to all cursor/presence updates
 */
export function subscribeToCursors(
  callback: (cursors: CursorsMap) => void
): () => void {
  const cursorsRef = ref(rtdb, `sessions/${CANVAS_ID}`);
  
  const listener = onValue(cursorsRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || {});
  });
  
  // Return unsubscribe function
  return () => off(cursorsRef, 'value', listener);
}

/**
 * Remove user's cursor (manual cleanup)
 */
export async function removeUserCursor(userId: string): Promise<void> {
  const userRef = ref(rtdb, `sessions/${CANVAS_ID}/${userId}`);
  await set(userRef, null);
}

