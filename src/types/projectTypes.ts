// Project-related TypeScript interfaces for multi-project system

export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string; // URL or base64 data
  ownerId: string; // User ID of the project owner
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  allowComments: boolean;
  allowViewing: boolean;
  defaultCanvasWidth: number;
  defaultCanvasHeight: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface ProjectMember {
  userId: string;
  email: string;
  displayName?: string;
  avatar?: string;
  role: ProjectRole;
  joinedAt: Date;
  lastActiveAt?: Date;
  isOnline: boolean;
}

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: ProjectRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface ProjectCanvas {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  width: number;
  height: number;
  backgroundColor: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  isArchived: boolean;
  order: number; // For canvas ordering within a project
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: ProjectActivityAction;
  targetType: 'project' | 'canvas' | 'member' | 'comment';
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type ProjectActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'invited'
  | 'joined'
  | 'left'
  | 'canvas_created'
  | 'canvas_updated'
  | 'canvas_deleted'
  | 'canvas_duplicated';

export interface ProjectSearchFilters {
  query?: string;
  role?: ProjectRole;
  isArchived?: boolean;
  sortBy?: 'name' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalCanvases: number;
  totalMembers: number;
  recentActivity: ProjectActivity[];
}

// Firebase collection paths
export const PROJECT_COLLECTIONS = {
  PROJECTS: "projects",
  MEMBERS: "members",
  CANVASES: "canvases",
  INVITATIONS: "invitations",
  ACTIVITIES: "activities",
  METADATA: "metadata"
} as const;

// Permission levels for role-based access
export const PROJECT_PERMISSIONS = {
  owner: ["read", "write", "delete", "manage_members", "manage_settings", "transfer_ownership"],
  admin: ["read", "write", "delete", "manage_members", "manage_settings"],
  editor: ["read", "write"],
  viewer: ["read"]
} as const;

export type ProjectPermission = typeof PROJECT_PERMISSIONS[keyof typeof PROJECT_PERMISSIONS][number];

// Permission type for general permission checking
export type Permission = 
  | 'project.read'
  | 'project.write'
  | 'project.delete'
  | 'project.edit'
  | 'members.invite'
  | 'members.edit'
  | 'members.transfer_ownership'
  | 'ai.assistant'
  | 'export.canvas'
  | 'canvas.read'
  | 'canvas.write'
  | 'canvas.delete'
  | 'canvas.edit';

// Presence and activity types
export interface PresenceData {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  currentActivity?: ActivityType;
  cursorPosition?: {
    x: number;
    y: number;
  };
  selectedShapeIds?: string[];
}

export type ActivityType = 
  | 'idle'
  | 'viewing'
  | 'editing'
  | 'selecting'
  | 'drawing'
  | 'typing'
  | 'navigating';

// Utility types
export type ProjectWithMembers = Project & {
  members: ProjectMember[];
  memberCount: number;
};

export type ProjectWithCanvases = Project & {
  canvases: ProjectCanvas[];
  canvasCount: number;
};

export type ProjectWithDetails = Project & {
  members: ProjectMember[];
  canvases: ProjectCanvas[];
  recentActivity: ProjectActivity[];
  stats: {
    memberCount: number;
    canvasCount: number;
    lastActivityAt: Date;
  };
};

// Form types for creating/updating projects
export interface CreateProjectData {
  name: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  thumbnail?: string;
  settings?: Partial<ProjectSettings>;
}

export interface InviteMemberData {
  email: string;
  role: ProjectRole;
  message?: string;
}

export interface TransferRequest {
  projectId: string;
  newOwnerId: string;
  newOwnerEmail: string;
  requesterId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  expiresAt: Date;
}