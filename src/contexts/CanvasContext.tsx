import { createContext, useContext, useState, useRef, type ReactNode } from "react";
import type Konva from "konva";
import { generateId } from "../utils/helpers";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_COLOR } from "../utils/constants";
import { useCanvasSync } from "../hooks/useCanvasSync";
import { useHistory } from "../hooks/useHistory";

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse';
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
  createdBy?: string;
  createdAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null; // Timestamp when lock was acquired (null when unlocked)
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
  
  // Z-index operations
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  
  // Canvas operations
  setScale: (scale: number) => void;
  setPosition: (position: { x: number; y: number }) => void;
  resetView: () => void;
  panToPosition: (canvasX: number, canvasY: number) => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Alignment operations
  alignLeft: (id: string) => void;
  alignRight: (id: string) => void;
  alignCenter: (id: string) => void;
  alignTop: (id: string) => void;
  alignBottom: (id: string) => void;
  alignMiddle: (id: string) => void;
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

  // History management
  const { pushState, undo, redo, canUndo, canRedo } = useHistory(
    shapes,
    selectedId,
    (_restoredShapes, restoredSelectedId) => {
      // This function is called when restoring from history
      // We need to restore the shapes to the sync system
      // For now, we'll just update the selectedId since shapes are managed by sync
      setSelectedId(restoredSelectedId);
      // Note: In a real implementation, we'd need to restore shapes to the sync system
      // This is a limitation of the current architecture
    }
  );

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
    } else if (type === 'ellipse') {
      defaultWidth = 150;
      defaultHeight = 80;
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
        fontStyle: 'normal',
        fontWeight: 'normal',
        textDecoration: 'none',
      }),
      // Apply any overrides
      ...overrides,
    };
    addShapeSync(newShape);
    // Push state to history after adding shape
    setTimeout(() => pushState(), 0);
  };

  const updateShape = (id: string, updates: Partial<Shape>) => {
    updateShapeSync(id, updates);
    // Push state to history after updating shape
    setTimeout(() => pushState(), 0);
  };

  const deleteShape = (id: string) => {
    deleteShapeSync(id);
    if (selectedId === id) {
      setSelectedId(null);
    }
    // Push state to history after deleting shape
    setTimeout(() => pushState(), 0);
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
  // Z-index management
  const bringToFront = (id: string) => {
    const maxZ = Math.max(...shapes.map(s => s.zIndex || 0), 0);
    updateShape(id, { zIndex: maxZ + 1 });
  };

  const sendToBack = (id: string) => {
    const minZ = Math.min(...shapes.map(s => s.zIndex || 0), 0);
    updateShape(id, { zIndex: minZ - 1 });
  };

  const bringForward = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    const currentZ = shape.zIndex || 0;
    updateShape(id, { zIndex: currentZ + 1 });
  };

  const sendBackward = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    const currentZ = shape.zIndex || 0;
    updateShape(id, { zIndex: currentZ - 1 });
  };

  const panToPosition = (canvasX: number, canvasY: number) => {
    // Get viewport center
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    // Calculate new stage position to center the target point
    const newX = viewportCenterX - canvasX * scale;
    const newY = viewportCenterY - canvasY * scale;
    
    setPositionState({ x: newX, y: newY });
  };

  // Alignment functions
  const alignLeft = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // Find the leftmost position among all shapes
    const leftmostX = Math.min(...shapes.map(s => s.x));
    updateShape(id, { x: leftmostX });
  };

  const alignRight = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // Find the rightmost position among all shapes
    const rightmostX = Math.max(...shapes.map(s => s.x + s.width));
    updateShape(id, { x: rightmostX - shape.width });
  };

  const alignCenter = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // Find the center position among all shapes
    const leftmostX = Math.min(...shapes.map(s => s.x));
    const rightmostX = Math.max(...shapes.map(s => s.x + s.width));
    const centerX = (leftmostX + rightmostX) / 2;
    updateShape(id, { x: centerX - shape.width / 2 });
  };

  const alignTop = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // Find the topmost position among all shapes
    const topmostY = Math.min(...shapes.map(s => s.y));
    updateShape(id, { y: topmostY });
  };

  const alignBottom = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // Find the bottommost position among all shapes
    const bottommostY = Math.max(...shapes.map(s => s.y + s.height));
    updateShape(id, { y: bottommostY - shape.height });
  };

  const alignMiddle = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // Find the middle position among all shapes
    const topmostY = Math.min(...shapes.map(s => s.y));
    const bottommostY = Math.max(...shapes.map(s => s.y + s.height));
    const middleY = (topmostY + bottommostY) / 2;
    updateShape(id, { y: middleY - shape.height / 2 });
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
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward,
        setScale,
        setPosition,
        resetView,
        panToPosition,
        undo,
        redo,
        canUndo,
        canRedo,
        alignLeft,
        alignRight,
        alignCenter,
        alignTop,
        alignBottom,
        alignMiddle,
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

