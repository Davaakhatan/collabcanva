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
  selectedIds: string[];
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  loading: boolean;
  
  // Zoom and pan state
  scale: number;
  position: { x: number; y: number };
  
  // Shape operations
  addShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse', overrides?: Partial<Shape>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  deleteSelectedShapes: () => void;
  selectShape: (id: string | null, addToSelection?: boolean) => void;
  selectShapes: (ids: string[]) => void;
  clearSelection: () => void;
  
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
  
  // Alignment operations (work on all selected shapes)
  alignLeft: () => void;
  alignRight: () => void;
  alignCenter: () => void;
  alignTop: () => void;
  alignBottom: () => void;
  alignMiddle: () => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
    selectedIds[0] || null, // Use first selected ID for history (simplified)
    (_restoredShapes, restoredSelectedId) => {
      // This function is called when restoring from history
      // We need to restore the shapes to the sync system
      // For now, we'll just update the selectedIds since shapes are managed by sync
      setSelectedIds(restoredSelectedId ? [restoredSelectedId] : []);
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
      defaultWidth = 150;
      defaultHeight = 150;
    } else if (type === 'ellipse') {
      defaultWidth = 200;
      defaultHeight = 120;
    } else if (type === 'text') {
      defaultWidth = 300;
      defaultHeight = 60;
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
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
    // Push state to history after deleting shape
    setTimeout(() => pushState(), 0);
  };

  const deleteSelectedShapes = () => {
    selectedIds.forEach(id => deleteShapeSync(id));
    setSelectedIds([]);
    // Push state to history after deleting shapes
    setTimeout(() => pushState(), 0);
  };

  const selectShape = (id: string | null, addToSelection = false) => {
    if (!id) {
      // Clear selection
      selectedIds.forEach(sid => unlockShapeSync(sid));
      setSelectedIds([]);
      return;
    }

    if (addToSelection) {
      // Cmd/Ctrl+Click: toggle shape in selection
      if (selectedIds.includes(id)) {
        // Remove from selection
        unlockShapeSync(id);
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
        // Add to selection
        lockShapeSync(id);
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      // Normal click: replace selection
      selectedIds.forEach(sid => {
        if (sid !== id) unlockShapeSync(sid);
      });
      
      setSelectedIds([id]);
      lockShapeSync(id);
    }
  };

  const selectShapes = (ids: string[]) => {
    // Unlock previously selected shapes
    selectedIds.forEach(sid => {
      if (!ids.includes(sid)) unlockShapeSync(sid);
    });
    
    // Lock newly selected shapes
    ids.forEach(id => lockShapeSync(id));
    
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    selectedIds.forEach(sid => unlockShapeSync(sid));
    setSelectedIds([]);
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

  // Alignment functions (work on all selected shapes)
  const alignLeft = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the leftmost position among selected shapes
    const leftmostX = Math.min(...selectedShapes.map(s => s.x));
    selectedIds.forEach(id => updateShape(id, { x: leftmostX }));
  };

  const alignRight = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the rightmost position among selected shapes
    const rightmostX = Math.max(...selectedShapes.map(s => s.x + s.width));
    selectedIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) updateShape(id, { x: rightmostX - shape.width });
    });
  };

  const alignCenter = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the center position among selected shapes
    const leftmostX = Math.min(...selectedShapes.map(s => s.x));
    const rightmostX = Math.max(...selectedShapes.map(s => s.x + s.width));
    const centerX = (leftmostX + rightmostX) / 2;
    selectedIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) updateShape(id, { x: centerX - shape.width / 2 });
    });
  };

  const alignTop = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the topmost position among selected shapes
    const topmostY = Math.min(...selectedShapes.map(s => s.y));
    selectedIds.forEach(id => updateShape(id, { y: topmostY }));
  };

  const alignBottom = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the bottommost position among selected shapes
    const bottommostY = Math.max(...selectedShapes.map(s => s.y + s.height));
    selectedIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) updateShape(id, { y: bottommostY - shape.height });
    });
  };

  const alignMiddle = () => {
    if (selectedIds.length === 0) return;
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    
    // Find the middle position among selected shapes
    const topmostY = Math.min(...selectedShapes.map(s => s.y));
    const bottommostY = Math.max(...selectedShapes.map(s => s.y + s.height));
    const middleY = (topmostY + bottommostY) / 2;
    selectedIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) updateShape(id, { y: middleY - shape.height / 2 });
    });
  };

  return (
    <CanvasContext.Provider
      value={{
        shapes,
        selectedIds,
        stageRef,
        loading,
        scale,
        position,
        addShape,
        updateShape,
        deleteShape,
        deleteSelectedShapes,
        selectShape,
        selectShapes,
        clearSelection,
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

