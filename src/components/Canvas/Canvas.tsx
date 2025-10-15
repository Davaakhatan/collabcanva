import { useEffect, useCallback, useState, useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import { useCanvas } from "../../contexts/CanvasContext";
import { useCursors } from "../../hooks/useCursors";
import { useAuth } from "../../contexts/AuthContext";
import Shape from "./Shape";
import Cursor from "../Collaboration/Cursor";
import PresenceList from "../Collaboration/PresenceList";
import EmptyState from "./EmptyState";
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED } from "../../utils/constants";
import { clamp } from "../../utils/helpers";

interface CanvasProps {
  onShowHelp?: () => void;
}

export default function Canvas({ onShowHelp }: CanvasProps) {
  const {
    shapes,
    selectedId,
    stageRef,
    loading,
    scale,
    position,
    setScale,
    setPosition,
    selectShape,
    updateShape,
    deleteShape,
    lockShape,
    addShape,
    panToPosition,
  } = useCanvas();

  const { cursors, updateCursor } = useCursors();
  const { user } = useAuth();
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Box selection state
  const [selectionBox, setSelectionBox] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  // Handle zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate new scale
      const scaleBy = 1 + ZOOM_SPEED;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = clamp(newScale, MIN_ZOOM, MAX_ZOOM);

      // Calculate new position to zoom towards cursor
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setScale(clampedScale);
      setPosition(newPos);
    },
    [stageRef, setScale, setPosition]
  );

  // Handle stage drag (pan)
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // Only update position if we're dragging the stage itself, not a shape
      if (e.target === e.target.getStage()) {
        setPosition({
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [setPosition]
  );

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert screen coordinates to canvas coordinates (world space)
      const canvasX = (pointer.x - position.x) / scale;
      const canvasY = (pointer.y - position.y) / scale;

      // Update cursor position with canvas coordinates (throttled in hook)
      updateCursor(canvasX, canvasY);
      
      // Mark as interacted
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    },
    [stageRef, updateCursor, hasInteracted, position, scale]
  );

  const handleAddFirstShape = () => {
    addShape('rectangle', { x: CANVAS_WIDTH / 2 - 50, y: CANVAS_HEIGHT / 2 - 50 });
    setHasInteracted(true);
  };

  // Handle clicking on a user in the presence list to jump to their cursor
  const handleUserClick = useCallback(
    (userId: string, cursorX: number, cursorY: number) => {
      console.log(`Panning to user ${userId} at canvas position:`, cursorX, cursorY);
      panToPosition(cursorX, cursorY);
    },
    [panToPosition]
  );

  // Handle box selection start
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only start box selection if clicking on stage (not on a shape)
      if (e.target !== e.target.getStage()) return;
      
      const stage = stageRef.current;
      if (!stage) return;
      
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
      
      // Convert screen coordinates to canvas coordinates
      const canvasX = (pointerPos.x - position.x) / scale;
      const canvasY = (pointerPos.y - position.y) / scale;
      
      selectionStartRef.current = { x: canvasX, y: canvasY };
      setSelectionBox({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
    },
    [position, scale, stageRef]
  );

  // Handle box selection update
  const handleStageMouseMove = useCallback(
    () => {
      if (!selectionStartRef.current) return;
      
      const stage = stageRef.current;
      if (!stage) return;
      
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
      
      // Convert screen coordinates to canvas coordinates
      const canvasX = (pointerPos.x - position.x) / scale;
      const canvasY = (pointerPos.y - position.y) / scale;
      
      setSelectionBox({
        x1: selectionStartRef.current.x,
        y1: selectionStartRef.current.y,
        x2: canvasX,
        y2: canvasY,
      });
    },
    [position, scale, stageRef]
  );

  // Handle box selection end
  const handleStageMouseUp = useCallback(
    () => {
      if (!selectionBox || !selectionStartRef.current) {
        selectionStartRef.current = null;
        setSelectionBox(null);
        return;
      }
      
      // Calculate selection box bounds
      const x1 = Math.min(selectionBox.x1, selectionBox.x2);
      const y1 = Math.min(selectionBox.y1, selectionBox.y2);
      const x2 = Math.max(selectionBox.x1, selectionBox.x2);
      const y2 = Math.max(selectionBox.y1, selectionBox.y2);
      
      // If box is too small (< 5px), treat as a click to deselect
      if (Math.abs(x2 - x1) < 5 && Math.abs(y2 - y1) < 5) {
        selectShape(null);
      } else {
        // Find shapes that intersect with selection box
        const selectedShapes = shapes.filter((shape) => {
          const shapeX1 = shape.x;
          const shapeY1 = shape.y;
          const shapeX2 = shape.x + shape.width;
          const shapeY2 = shape.y + shape.height;
          
          // Check if rectangles intersect
          return !(x2 < shapeX1 || x1 > shapeX2 || y2 < shapeY1 || y1 > shapeY2);
        });
        
        // Select the first shape in the box (for now, only single selection supported)
        if (selectedShapes.length > 0) {
          selectShape(selectedShapes[0].id);
        } else {
          selectShape(null);
        }
      }
      
      // Clear selection box
      selectionStartRef.current = null;
      setSelectionBox(null);
    },
    [selectionBox, shapes, selectShape]
  );

  // Handle clicking on empty canvas (keep for compatibility)
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Deselect when clicking on empty area
      if (e.target === e.target.getStage()) {
        selectShape(null);
      }
    },
    [selectShape]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Prevent default backspace navigation
        e.preventDefault();
        
        // Check if shape is locked by another user
        const shape = shapes.find(s => s.id === selectedId);
        if (shape && shape.isLocked && shape.lockedBy !== (user as any)?.uid) {
          console.warn('Cannot delete: shape is locked by another user');
          return;
        }
        
        deleteShape(selectedId);
      }
      
      // Duplicate (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const shape = shapes.find(s => s.id === selectedId);
        if (shape) {
          addShape(shape.type, {
            x: shape.x + 20,
            y: shape.y + 20,
            width: shape.width,
            height: shape.height,
            fill: shape.fill,
            rotation: shape.rotation,
            text: shape.text,
            fontSize: shape.fontSize,
            fontFamily: shape.fontFamily,
          });
        }
      }
      
      // Select All (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        // For now, just select the first shape (single selection only)
        if (shapes.length > 0) {
          selectShape(shapes[0].id);
        }
      }
      
      // Arrow keys for moving selected shape
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const shape = shapes.find(s => s.id === selectedId);
        if (shape) {
          const moveDistance = e.shiftKey ? 10 : 1; // Shift = 10px, normal = 1px
          let newX = shape.x;
          let newY = shape.y;
          
          switch (e.key) {
            case 'ArrowUp':
              newY -= moveDistance;
              break;
            case 'ArrowDown':
              newY += moveDistance;
              break;
            case 'ArrowLeft':
              newX -= moveDistance;
              break;
            case 'ArrowRight':
              newX += moveDistance;
              break;
          }
          
          updateShape(selectedId, { x: newX, y: newY });
        }
      }
      
      // Z-index shortcuts
      if (selectedId && (e.metaKey || e.ctrlKey)) {
        if (e.key === ']' && !e.shiftKey) {
          e.preventDefault();
          // Bring to front
          const maxZ = Math.max(...shapes.map(s => s.zIndex || 0), 0);
          updateShape(selectedId, { zIndex: maxZ + 1 });
        } else if (e.key === '[' && !e.shiftKey) {
          e.preventDefault();
          // Send to back
          const minZ = Math.min(...shapes.map(s => s.zIndex || 0), 0);
          updateShape(selectedId, { zIndex: minZ - 1 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes, deleteShape, addShape, selectShape, updateShape]);

  // Update stage scale and position
  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: scale, y: scale });
      stage.position(position);
      stage.batchDraw();
    }
  }, [scale, position]);

  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading canvas...</p>
          <p className="text-xs text-gray-400">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }
  
  console.log('Canvas loaded:', { shapesCount: shapes.length, loading });

  const showEmptyState = shapes.length === 0 && !hasInteracted;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Konva Canvas */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        draggable
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseDown={handleStageMouseDown}
        onMouseMove={() => {
          handleMouseMove();
          handleStageMouseMove();
        }}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {/* Canvas background - showing bounded area */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#ffffff"
            listening={false}
          />
          
          {/* Canvas border */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            stroke="#e0e0e0"
            strokeWidth={2}
            listening={false}
          />

          {/* Render shapes (sorted by z-index) */}
          {[...shapes]
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedId}
                onSelect={() => selectShape(shape.id)}
                onChange={(updates) => updateShape(shape.id, updates)}
                onLock={() => lockShape(shape.id)}
              />
            ))}

          {/* Render selection box */}
          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.x1, selectionBox.x2)}
              y={Math.min(selectionBox.y1, selectionBox.y2)}
              width={Math.abs(selectionBox.x2 - selectionBox.x1)}
              height={Math.abs(selectionBox.y2 - selectionBox.y1)}
              fill="rgba(0, 102, 255, 0.1)"
              stroke="#0066FF"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Render other users' cursors */}
      {Object.entries(cursors).map(([userId, cursor]) => {
        // Transform canvas coordinates to screen coordinates
        const screenX = (cursor.cursorX * scale) + position.x;
        const screenY = (cursor.cursorY * scale) + position.y;
        
        return (
          <Cursor
            key={userId}
            x={screenX}
            y={screenY}
            color={cursor.cursorColor}
            name={cursor.displayName}
          />
        );
      })}

      {/* Presence list */}
      <PresenceList cursors={cursors} onUserClick={handleUserClick} />

      {/* Empty State */}
      {showEmptyState && (
        <EmptyState
          onAddShape={handleAddFirstShape}
          onShowHelp={() => onShowHelp?.()}
        />
      )}
    </div>
  );
}

