import { useEffect, useCallback, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import { useCanvas } from "../../contexts/CanvasContext";
import { useCursors } from "../../hooks/useCursors";
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
    unlockShape,
    addShape,
  } = useCanvas();

  const { cursors, updateCursor } = useCursors();
  const [hasInteracted, setHasInteracted] = useState(false);

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

      // Update cursor position (throttled in hook)
      updateCursor(pointer.x, pointer.y);
      
      // Mark as interacted
      if (!hasInteracted) {
        setHasInteracted(true);
      }
    },
    [stageRef, updateCursor, hasInteracted]
  );

  const handleAddFirstShape = () => {
    addShape('rectangle', { x: CANVAS_WIDTH / 2 - 50, y: CANVAS_HEIGHT / 2 - 50 });
    setHasInteracted(true);
  };

  // Handle clicking on empty canvas
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Deselect when clicking on empty area
      if (e.target === e.target.getStage()) {
        selectShape(null);
      }
    },
    [selectShape]
  );

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Prevent default backspace navigation
        e.preventDefault();
        deleteShape(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteShape]);

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
        onMouseMove={handleMouseMove}
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

          {/* Render shapes */}
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => selectShape(shape.id)}
              onChange={(updates) => updateShape(shape.id, updates)}
              onLock={() => lockShape(shape.id)}
              onUnlock={() => unlockShape(shape.id)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Render other users' cursors */}
      {Object.entries(cursors).map(([userId, cursor]) => (
        <Cursor
          key={userId}
          x={cursor.cursorX}
          y={cursor.cursorY}
          color={cursor.cursorColor}
          name={cursor.displayName}
        />
      ))}

      {/* Presence list */}
      <PresenceList />

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

