import { createContext, useContext, useState, useRef, type ReactNode } from "react";
import type Konva from "konva";
import { generateId } from "../utils/helpers";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_COLOR } from "../utils/constants";
import { useCanvasSync } from "../hooks/useCanvasSync";

export interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Rotation in degrees
  fill: string;
  createdBy?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
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
  addShape: (type: 'rectangle', position?: { x: number; y: number }) => void;
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

  const addShape = (type: 'rectangle', position?: { x: number; y: number }) => {
    const newShape: Shape = {
      id: generateId(),
      type,
      x: position?.x ?? 100,
      y: position?.y ?? 100,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      rotation: 0,
      fill: DEFAULT_SHAPE_COLOR,
      createdAt: Date.now(),
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

