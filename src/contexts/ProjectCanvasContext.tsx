// Project-aware canvas context for multi-project system
// Provides canvas functionality with project-specific Firebase synchronization

import { createContext, useContext, useState, useRef, type ReactNode } from "react";
import type Konva from "konva";
import { generateId } from "../utils/helpers";
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_COLOR } from "../utils/constants";
import { useProjectCanvasSync } from "../hooks/useProjectCanvasSync";
import { useHistory } from "../hooks/useHistory";

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
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isLocked?: boolean;
  lockedBy?: string | null;
  lockedAt?: number | null; // Timestamp when lock was acquired (null when unlocked)
}

interface ProjectCanvasContextType {
  // Canvas state
  shapes: Shape[];
  selectedIds: string[];
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  loading: boolean;
  error: string | null;
  
  // Project info
  projectId: string | null;
  canvasId: string | null;
  
  // Zoom and pan state
  scale: number;
  position: { x: number; y: number };
  
  // Shape operations
  addShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image', overrides?: Partial<Shape>) => void;
  addImageShape: (file: File, overrides?: Partial<Shape>) => Promise<void>;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  updateSelectedShapes: (updates: Partial<Shape>) => void; // Batch update all selected shapes with same updates
  batchUpdateShapes: (updates: Array<{ id: string; updates: Partial<Shape> }>) => void; // Batch update with different updates per shape
  deleteShape: (id: string) => void;
  deleteSelectedShapes: () => Promise<void>;
  selectShape: (id: string | null, addToSelection?: boolean) => Promise<void>;
  selectShapes: (ids: string[]) => Promise<void>;
  clearSelection: () => void;
  
  // Locking operations
  lockShape: (id: string) => Promise<boolean>;
  unlockShape: (id: string) => void;
  
  // Z-index operations (work on all selected shapes)
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  
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
  
  // Project canvas operations
  setCurrentCanvas: (projectId: string, canvasId: string) => void;
  clearCurrentCanvas: () => void;
  refreshCanvas: () => Promise<void>;
  clearError: () => void;
}

const ProjectCanvasContext = createContext<ProjectCanvasContextType | null>(null);

export function ProjectCanvasProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scale, setScaleState] = useState(1);
  const [position, setPositionState] = useState({ x: 0, y: 0 });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  
  // Use project-aware canvas sync hook
  const {
    shapes,
    loading,
    error,
    addShape: addShapeSync,
    updateShape: updateShapeSync,
    updateShapes: updateShapesSync,
    deleteShape: deleteShapeSync,
    lockShape: lockShapeSync,
    unlockShape: unlockShapeSync,
    clearError: clearErrorSync,
    refreshCanvas: refreshCanvasSync,
  } = useProjectCanvasSync({
    projectId: projectId || '',
    canvasId: canvasId || '',
    enabled: !!(projectId && canvasId)
  });

  // History management
  const { pushState, undo, redo, canUndo, canRedo } = useHistory(
    shapes,
    selectedIds,
    (restoredShapes, restoredSelectedIds) => {
      // This function is called when restoring from history
      console.log('🔄 Restoring from project canvas history:', { 
        projectId, 
        canvasId, 
        shapeCount: restoredShapes.length, 
        selectedIds: restoredSelectedIds 
      });
      
      // Update the shapes in the sync system
      updateShapesSync(restoredShapes);
      setSelectedIds(restoredSelectedIds);
      
      console.log('✅ Project canvas history restoration complete');
    }
  );

  // Direct history push for immediate saving
  const saveToHistory = () => {
    console.log('💾 Saving to project canvas history...', { projectId, canvasId });
    pushState();
  };

  // Wrapper functions for undo/redo with debugging
  const handleUndo = () => {
    console.log('⏪ Undo button clicked in project canvas', { projectId, canvasId });
    undo();
  };

  const handleRedo = () => {
    console.log('⏩ Redo button clicked in project canvas', { projectId, canvasId });
    redo();
  };

  // Set current canvas
  const setCurrentCanvas = (newProjectId: string, newCanvasId: string) => {
    console.log('Setting current project canvas:', { newProjectId, newCanvasId });
    setProjectId(newProjectId);
    setCanvasId(newCanvasId);
    // Clear selection when switching canvases
    setSelectedIds([]);
  };

  // Clear current canvas
  const clearCurrentCanvas = () => {
    console.log('Clearing current project canvas');
    setProjectId(null);
    setCanvasId(null);
    setSelectedIds([]);
  };

  // Refresh canvas
  const refreshCanvas = async () => {
    if (projectId && canvasId) {
      await refreshCanvasSync();
    }
  };

  // Clear error
  const clearError = () => {
    clearErrorSync();
  };

  // Image upload function
  const uploadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const addImageShape = async (file: File, overrides?: Partial<Shape>) => {
    if (!projectId || !canvasId) {
      throw new Error('No project canvas selected');
    }

    try {
      const imageUrl = await uploadImage(file);
      const newShape: Shape = {
        id: generateId(),
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        rotation: 0,
        fill: 'transparent',
        imageUrl,
        imageAlt: file.name,
        createdAt: Date.now(),
        ...overrides,
      };
      await addShapeSync(newShape);
      console.log('🎨 [addImageShape] Image shape added to project canvas:', { projectId, canvasId, newShape });
      saveToHistory();
    } catch (error) {
      console.error('Failed to upload image to project canvas:', error);
      throw error;
    }
  };

  const addShape = (
    type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse' | 'star' | 'polygon' | 'path' | 'image',
    overrides?: Partial<Shape>
  ) => {
    console.log('[ProjectCanvasContext] addShape called', { type, projectId, canvasId, hasOverrides: !!overrides });
    if (!projectId || !canvasId) {
      console.error('[ProjectCanvasContext] Cannot add shape: no project canvas selected', { projectId, canvasId });
      return;
    }

    const newShape: Shape = {
      id: generateId(),
      type,
      x: 100,
      y: 100,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      rotation: 0,
      fill: DEFAULT_SHAPE_COLOR,
      zIndex: Math.max(...shapes.map(s => s.zIndex || 0), 0) + 1,
      ...overrides,
    };

    // Set default properties based on shape type
    switch (type) {
      case 'text':
        newShape.text = 'Text';
        newShape.fontSize = 16;
        newShape.fontFamily = 'Arial';
        newShape.fontStyle = 'normal';
        newShape.fontWeight = 'normal';
        newShape.textDecoration = 'none';
        newShape.fill = '#000000';
        break;
      case 'star':
        newShape.numPoints = 5;
        newShape.innerRadius = 0.4;
        break;
      case 'polygon':
        newShape.sides = 6;
        break;
      case 'path':
        newShape.pathData = 'M10,10 L50,50 L10,50 Z';
        break;
    }

    addShapeSync(newShape);
    console.log('🎨 [addShape] Shape added to project canvas:', { projectId, canvasId, newShape });
    saveToHistory();
  };

  const updateShape = (id: string, updates: Partial<Shape>) => {
    if (!projectId || !canvasId) {
      console.error('Cannot update shape: no project canvas selected');
      return;
    }

    updateShapeSync(id, updates);
    console.log('✏️ [updateShape] Shape updated in project canvas:', { projectId, canvasId, id, updates });
    saveToHistory();
  };

  const updateSelectedShapes = (updates: Partial<Shape>) => {
    if (!projectId || !canvasId) {
      console.error('Cannot update selected shapes: no project canvas selected');
      return;
    }

    if (selectedIds.length === 0) return;

    const updatedShapes = shapes.map(shape =>
      selectedIds.includes(shape.id)
        ? { ...shape, ...updates }
        : shape
    );

    updateShapesSync(updatedShapes);
    console.log('✏️ [updateSelectedShapes] Selected shapes updated in project canvas:', { 
      projectId, 
      canvasId, 
      selectedIds, 
      updates 
    });
    saveToHistory();
  };

  const batchUpdateShapes = (updates: Array<{ id: string; updates: Partial<Shape> }>) => {
    if (!projectId || !canvasId) {
      console.error('Cannot batch update shapes: no project canvas selected');
      return;
    }

    const updatedShapes = shapes.map(shape => {
      const update = updates.find(u => u.id === shape.id);
      return update ? { ...shape, ...update.updates } : shape;
    });

    updateShapesSync(updatedShapes);
    console.log('✏️ [batchUpdateShapes] Shapes batch updated in project canvas:', { 
      projectId, 
      canvasId, 
      updateCount: updates.length 
    });
    saveToHistory();
  };

  const deleteShape = (id: string) => {
    if (!projectId || !canvasId) {
      console.error('Cannot delete shape: no project canvas selected');
      return;
    }

    deleteShapeSync(id);
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    console.log('🗑️ [deleteShape] Shape deleted from project canvas:', { projectId, canvasId, id });
    saveToHistory();
  };

  const deleteSelectedShapes = async () => {
    if (!projectId || !canvasId) {
      console.error('Cannot delete selected shapes: no project canvas selected');
      return;
    }

    if (selectedIds.length === 0) return;

    // Delete all selected shapes
    for (const id of selectedIds) {
      await deleteShapeSync(id);
    }

    setSelectedIds([]);
    console.log('🗑️ [deleteSelectedShapes] Selected shapes deleted from project canvas:', { 
      projectId, 
      canvasId, 
      deletedIds: selectedIds 
    });
    saveToHistory();
  };

  const selectShape = async (id: string | null, addToSelection = false) => {
    if (id === null) {
      setSelectedIds([]);
      return;
    }

    if (addToSelection) {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const selectShapes = async (ids: string[]) => {
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const lockShape = async (id: string): Promise<boolean> => {
    if (!projectId || !canvasId) {
      console.error('Cannot lock shape: no project canvas selected');
      return false;
    }

    try {
      await lockShapeSync(id);
      console.log('🔒 [lockShape] Shape locked in project canvas:', { projectId, canvasId, id });
      return true;
    } catch (error) {
      console.error('Failed to lock shape in project canvas:', error);
      return false;
    }
  };

  const unlockShape = (id: string) => {
    if (!projectId || !canvasId) {
      console.error('Cannot unlock shape: no project canvas selected');
      return;
    }

    unlockShapeSync(id);
    console.log('🔓 [unlockShape] Shape unlocked in project canvas:', { projectId, canvasId, id });
  };

  // Z-index operations
  const bringToFront = () => {
    if (selectedIds.length === 0) return;

    const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0));
    const updates = selectedIds.map((id, index) => ({
      id,
      updates: { zIndex: maxZIndex + index + 1 }
    }));

    batchUpdateShapes(updates);
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;

    const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0));
    const updates = selectedIds.map((id, index) => ({
      id,
      updates: { zIndex: minZIndex - index - 1 }
    }));

    batchUpdateShapes(updates);
  };

  const bringForward = () => {
    if (selectedIds.length === 0) return;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { zIndex: (shape?.zIndex || 0) + 1 }
      };
    });

    batchUpdateShapes(updates);
  };

  const sendBackward = () => {
    if (selectedIds.length === 0) return;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { zIndex: Math.max((shape?.zIndex || 0) - 1, 0) }
      };
    });

    batchUpdateShapes(updates);
  };

  // Canvas operations
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

  const panToPosition = (canvasX: number, canvasY: number) => {
    console.log('🎯 [ProjectCanvasContext] panToPosition called with:', { canvasX, canvasY, currentScale: scale });
    
    // Get viewport center
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    // Calculate new stage position to center the target point
    const newX = viewportCenterX - canvasX * scale;
    const newY = viewportCenterY - canvasY * scale;
    
    console.log('🎯 [ProjectCanvasContext] Calculated new position:', { newX, newY, viewportCenterX, viewportCenterY });
    
    // Force update the position state
    setPositionState({ x: newX, y: newY });
    
    // Also try to update the stage directly if available
    if (stageRef.current) {
      console.log('🎯 [ProjectCanvasContext] Updating stage position directly');
      stageRef.current.position({ x: newX, y: newY });
      stageRef.current.batchDraw();
      
      // Force a redraw to ensure the position change is visible
      setTimeout(() => {
        if (stageRef.current) {
          stageRef.current.batchDraw();
          console.log('🎯 [ProjectCanvasContext] Forced redraw completed');
        }
      }, 10);
    } else {
      console.log('❌ [ProjectCanvasContext] stageRef.current is null');
    }
    
    console.log('✅ [ProjectCanvasContext] Position updated');
  };

  // Alignment operations
  const alignLeft = () => {
    if (selectedIds.length < 2) return;

    const leftmostX = Math.min(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return shape?.x || 0;
    }));

    updateSelectedShapes({ x: leftmostX });
  };

  const alignRight = () => {
    if (selectedIds.length < 2) return;

    const rightmostX = Math.max(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return (shape?.x || 0) + (shape?.width || 0);
    }));

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { x: rightmostX - (shape?.width || 0) }
      };
    });

    batchUpdateShapes(updates);
  };

  const alignCenter = () => {
    if (selectedIds.length < 2) return;

    const centerX = selectedIds.reduce((sum, id) => {
      const shape = shapes.find(s => s.id === id);
      return sum + (shape?.x || 0) + (shape?.width || 0) / 2;
    }, 0) / selectedIds.length;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { x: centerX - (shape?.width || 0) / 2 }
      };
    });

    batchUpdateShapes(updates);
  };

  const alignTop = () => {
    if (selectedIds.length < 2) return;

    const topmostY = Math.min(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return shape?.y || 0;
    }));

    updateSelectedShapes({ y: topmostY });
  };

  const alignBottom = () => {
    if (selectedIds.length < 2) return;

    const bottommostY = Math.max(...selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return (shape?.y || 0) + (shape?.height || 0);
    }));

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { y: bottommostY - (shape?.height || 0) }
      };
    });

    batchUpdateShapes(updates);
  };

  const alignMiddle = () => {
    if (selectedIds.length < 2) return;

    const centerY = selectedIds.reduce((sum, id) => {
      const shape = shapes.find(s => s.id === id);
      return sum + (shape?.y || 0) + (shape?.height || 0) / 2;
    }, 0) / selectedIds.length;

    const updates = selectedIds.map(id => {
      const shape = shapes.find(s => s.id === id);
      return {
        id,
        updates: { y: centerY - (shape?.height || 0) / 2 }
      };
    });

    batchUpdateShapes(updates);
  };

  const value: ProjectCanvasContextType = {
    // Canvas state
    shapes,
    selectedIds,
    stageRef,
    loading,
    error,
    
    // Project info
    projectId,
    canvasId,
    
    // Zoom and pan state
    scale,
    position,
    
    // Shape operations
    addShape,
    addImageShape,
    updateShape,
    updateSelectedShapes,
    batchUpdateShapes,
    deleteShape,
    deleteSelectedShapes,
    selectShape,
    selectShapes,
    clearSelection,
    
    // Locking operations
    lockShape,
    unlockShape,
    
    // Z-index operations
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    
    // Canvas operations
    setScale,
    setPosition,
    resetView,
    panToPosition,
    
    // History operations
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    
    // Alignment operations
    alignLeft,
    alignRight,
    alignCenter,
    alignTop,
    alignBottom,
    alignMiddle,
    
    // Project canvas operations
    setCurrentCanvas,
    clearCurrentCanvas,
    refreshCanvas,
    clearError,
  };

  return (
    <ProjectCanvasContext.Provider value={value}>
      {children}
    </ProjectCanvasContext.Provider>
  );
}

export function useProjectCanvas() {
  const context = useContext(ProjectCanvasContext);
  if (!context) {
    throw new Error('useProjectCanvas must be used within a ProjectCanvasProvider');
  }
  return context;
}

export default ProjectCanvasContext;