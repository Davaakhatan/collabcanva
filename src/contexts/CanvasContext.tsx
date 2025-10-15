import { createContext, useContext, useState, useRef, type ReactNode } from "react";
import type Konva from "konva";
import { generateId } from "../utils/helpers";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_COLOR } from "../utils/constants";
import { useCanvasSync } from "../hooks/useCanvasSync";

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Rotation in degrees
  fill: string;
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  createdBy?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number; // Timestamp when lock was acquired
}

interface CanvasContextType {
  // Canvas state
  shapes: Shape[];
  selectedId: string | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  loading: boolean;
  
  // Zoom and pan state
  scale: number;
  position: { x: number; y: number };
  
  // Shape operations
  addShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse', overrides?: Partial<Shape>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  
  // Locking operations
  lockShape: (id: string) => Promise<boolean>;
  unlockShape: (id: string) => void;
  
  // Canvas operations
  setScale: (scale: number) => void;
  setPosition: (position: { x: number; y: number }) => void;
  resetView: () => void;
  panToPosition: (canvasX: number, canvasY: number) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScaleState] = useState(1);
  const [position, setPositionState] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage | null>(null);
  
  // Use real-time sync hook
  const {
    shapes,
    loading,
    addShape: addShapeSync,
    updateShape: updateShapeSync,
    deleteShape: deleteShapeSync,
    lockShape: lockShapeSync,
    unlockShape: unlockShapeSync,
  } = useCanvasSync();

  const addShape = (
    type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse',
    overrides?: Partial<Shape>
  ) => {
    // Default dimensions based on shape type
    let defaultWidth = DEFAULT_SHAPE_WIDTH;
    let defaultHeight = DEFAULT_SHAPE_HEIGHT;
    
    if (type === 'circle') {
      defaultWidth = 100;
      defaultHeight = 100;
    } else if (type === 'text') {
      defaultWidth = 200;
      defaultHeight = 40;
    }

    const newShape: Shape = {
      id: generateId(),
      type,
      x: 100,
      y: 100,
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
      fill: DEFAULT_SHAPE_COLOR,
      createdAt: Date.now(),
      // Text-specific defaults
      ...(type === 'text' && {
        text: 'Double-click to edit',
        fontSize: 16,
        fontFamily: 'Arial',
      }),
      // Apply any overrides
      ...overrides,
    };
    addShapeSync(newShape);
  };

  const updateShape = (id: string, updates: Partial<Shape>) => {
    updateShapeSync(id, updates);
  };

  const deleteShape = (id: string) => {
    deleteShapeSync(id);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const selectShape = (id: string | null) => {
    // Unlock previously selected shape when deselecting
    if (selectedId && selectedId !== id) {
      console.log(`[CanvasContext] Deselecting shape ${selectedId}, selecting ${id}, unlocking ${selectedId}`);
      unlockShapeSync(selectedId);
    } else if (id) {
      console.log(`[CanvasContext] Selecting shape ${id} (no previous selection to unlock)`);
    } else {
      console.log(`[CanvasContext] Deselecting all (clicking empty canvas)`);
    }
    setSelectedId(id);
  };

  const lockShape = async (id: string): Promise<boolean> => {
    const result = await lockShapeSync(id);
    return result ?? false;
  };

  const unlockShape = (id: string) => {
    unlockShapeSync(id);
  };

  const setScale = (newScale: number) => {
    setScaleState(newScale);
  };

  const setPosition = (newPosition: { x: number; y: number }) => {
    setPositionState(newPosition);
  };

  const resetView = () => {
    setScaleState(1);
    setPositionState({ x: 0, y: 0 });
  };

  // Pan to a specific canvas position (e.g., another user's cursor)
  const panToPosition = (canvasX: number, canvasY: number) => {
    // Get viewport center
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    // Calculate new stage position to center the target point
    const newX = viewportCenterX - canvasX * scale;
    const newY = viewportCenterY - canvasY * scale;
    
    setPositionState({ x: newX, y: newY });
  };

  return (
    <CanvasContext.Provider
      value={{
        shapes,
        selectedId,
        stageRef,
        loading,
        scale,
        position,
        addShape,
        updateShape,
        deleteShape,
        selectShape,
        lockShape,
        unlockShape,
        setScale,
        setPosition,
        resetView,
        panToPosition,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}

