// Presence-related type definitions

export interface PresenceData {
  userId: string;
  userName: string;
  displayName?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  activity: ActivityType;
  selectedShapeIds?: string[];
  selectedShapes?: string[];
  isTyping?: boolean;
  cursorPosition?: {
    x: number;
    y: number;
  };
  cursorColor?: string;
}

export type ActivityType = 
  | 'idle'
  | 'viewing'
  | 'editing'
  | 'collaborating'
  | 'away';

export interface PresenceUpdate {
  userId: string;
  activity: ActivityType;
  selectedShapeIds?: string[];
  cursorPosition?: {
    x: number;
    y: number;
  };
  isTyping?: boolean;
}

export interface PresenceState {
  users: Map<string, PresenceData>;
  currentUser: PresenceData | null;
  isConnected: boolean;
}
