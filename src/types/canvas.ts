export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Rotation in degrees
  fill: string;
  zIndex?: number; // Layer order (higher = on top)
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  fontWeight?: 'normal' | 'bold';
  textDecoration?: 'none' | 'underline';
  // Star-specific properties
  numPoints?: number; // Number of points for star (default 5)
  innerRadius?: number; // Inner radius for star (default 0.4)
  // Polygon-specific properties
  sides?: number; // Number of sides for polygon (default 6)
  // Path-specific properties
  pathData?: string; // SVG path data
  // Image-specific properties
  imageUrl?: string; // URL or data URL of the image
  imageAlt?: string; // Alt text for accessibility
  createdBy?: string;
  createdAt?: number;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null;
}

export interface CanvasState {
  shapes: Shape[];
  selectedShapeIds: string[];
  isPanning: boolean;
  isZooming: boolean;
  zoom: number;
  panX: number;
  panY: number;
  isMultiSelecting: boolean;
  multiSelectStart: { x: number; y: number } | null;
  multiSelectEnd: { x: number; y: number } | null;
}

export interface CanvasHistory {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

export interface CanvasSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  backgroundColor: string;
  width: number;
  height: number;
}
