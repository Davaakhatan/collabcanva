// Canvas dimensions
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Viewport dimensions (will be overridden by actual window size)
export const VIEWPORT_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1920;
export const VIEWPORT_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 1080;

// Zoom constraints
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_SPEED = 0.1;

// Grid settings (optional visual reference)
export const GRID_SIZE = 50;
export const GRID_COLOR = '#e0e0e0';

// Default shape properties
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const DEFAULT_SHAPE_COLOR = '#cccccc';

// Cursor colors palette
export const CURSOR_COLORS = [
  '#FF5733', // Red
  '#33C1FF', // Blue
  '#33FF57', // Green
  '#FF33F5', // Pink
  '#FFD433', // Yellow
  '#8B33FF', // Purple
  '#FF8B33', // Orange
  '#33FFD4', // Cyan
  '#FF3333', // Bright Red
  '#3357FF', // Bright Blue
];

// Performance settings
export const CURSOR_UPDATE_THROTTLE = 50; // ms (20 FPS for cursors)
export const SHAPE_UPDATE_DEBOUNCE = 100; // ms

// Lock timeout
export const SHAPE_LOCK_TIMEOUT = 5000; // ms (5 seconds)

