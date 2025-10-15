import { useEffect, useRef } from "react";
import { Rect, Circle, Ellipse, Line, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { useAuth } from "../../contexts/AuthContext";
import type { Shape as ShapeType } from "../../contexts/CanvasContext";

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  onSelect: (e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<ShapeType>) => void;
  onStartEditText?: (shapeId: string) => void;
}

export default function Shape({ shape, isSelected, onSelect, onChange, onStartEditText }: ShapeProps) {
  const { user } = useAuth();
  const shapeRef = useRef<any>(null); // Can be Rect, Circle, Line, or Text
  const transformerRef = useRef<Konva.Transformer>(null);
  const hasLockedRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Check if locked by someone else
  const userId = (user as any)?.uid || null;
  
  // Check if lock is stale (older than 10 seconds)
  const isLockStale = shape.isLocked && shape.lockedAt && (Date.now() - shape.lockedAt) > 10000;
  
  // Consider locked by other only if locked, not by me, and not stale
  const isLockedByOther = shape.isLocked && shape.lockedBy !== userId && !isLockStale;

  // Lock is now handled in selectShape/selectShapes functions
  // This effect just resets the lock ref when deselected
  useEffect(() => {
    // Reset lock ref when deselected
    if (!isSelected) {
      hasLockedRef.current = false;
    }
  }, [isSelected]);

  // Separate effect for transformer attachment to ensure it always updates
  useEffect(() => {
    if (isSelected && !isLockedByOther && transformerRef.current && shapeRef.current) {
      // Attach transformer to the shape
      console.log('Attaching transformer to shape:', shape.id);
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isLockedByOther, shape.id, shape.x, shape.y, shape.width, shape.height, shape.rotation]);

  // Handle mouse/touch down to track starting position
  const handlePointerDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Only use click detection if shape is NOT already selected
    // If already selected, let normal drag behavior work
    if (!isSelected) {
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          mouseDownPosRef.current = { x: pointerPos.x, y: pointerPos.y };
        }
      }
    }
  };

  // Handle mouse/touch up to detect clicks (even with slight movement)
  const handlePointerUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Only use click detection for non-selected shapes
    if (isSelected || !mouseDownPosRef.current) {
      mouseDownPosRef.current = null;
      return;
    }

    // PREVENT selection if locked by another user
    if (isLockedByOther) {
      console.warn('Shape is locked by another user, cannot select');
      mouseDownPosRef.current = null;
      return;
    }

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Calculate distance moved
    const dx = pointerPos.x - mouseDownPosRef.current.x;
    const dy = pointerPos.y - mouseDownPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved less than 5 pixels, treat as a click/selection
    if (distance < 5) {
      console.log('Shape clicked (with tolerance):', shape.id);
      onSelect(e); // Pass event to check for Cmd/Ctrl key
    }

    mouseDownPosRef.current = null;
  };

  const handleDragStart = async () => {
    // Shape is already locked when selected, no need to lock again
    // Clear mousedown position since we're now dragging
    mouseDownPosRef.current = null;
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    let newX = e.target.x();
    let newY = e.target.y();
    
    // For shapes that render from center (circle, ellipse, triangle),
    // we need to convert the center position back to top-left corner
    if (shape.type === 'circle' || shape.type === 'ellipse') {
      newX = newX - shape.width / 2;
      newY = newY - shape.height / 2;
    } else if (shape.type === 'triangle') {
      newX = newX - shape.width / 2;
      newY = newY - shape.height / 2;
    }
    
    onChange({
      x: newX,
      y: newY,
    });
    // Don't unlock here - will unlock when deselected
  };

  const handleTransformStart = async () => {
    // Shape is already locked when selected, no need to lock again
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale and apply it to width/height
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(5, node.width() * scaleX);
    const newHeight = Math.max(5, node.height() * scaleY);
    
    let newX = node.x();
    let newY = node.y();
    
    // For shapes that render from center (circle, ellipse, triangle),
    // we need to convert the center position back to top-left corner
    if (shape.type === 'circle' || shape.type === 'ellipse') {
      newX = newX - newWidth / 2;
      newY = newY - newHeight / 2;
    } else if (shape.type === 'triangle') {
      newX = newX - newWidth / 2;
      newY = newY - newHeight / 2;
    }

    onChange({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      rotation: rotation,
    });
    
    // Don't unlock here - will unlock when deselected
  };

  // Determine stroke color based on selection and lock state
  let strokeColor = undefined;
  let strokeWidth = 0;
  
  if (isSelected) {
    // Blue border when selected by me (I'm actively using it)
    strokeColor = '#0066FF';
    strokeWidth = 2;
  } else if (isLockedByOther) {
    // Red border when locked by someone else (they're using it)
    strokeColor = '#FF3333';
    strokeWidth = 2;
  }
  // No border when not selected and not locked = anyone can use it

  // Common props for all shapes
  const commonProps = {
    ref: shapeRef,
    draggable: !isLockedByOther,
    onMouseDown: handlePointerDown,
    onMouseUp: handlePointerUp,
    onTouchStart: handlePointerDown,
    onTouchEnd: handlePointerUp,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTransformStart: handleTransformStart,
    onTransformEnd: handleTransformEnd,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    opacity: isLockedByOther ? 0.6 : 1,
  };

  // Render shape based on type
  const renderShape = () => {
    switch (shape.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'circle':
        return (
          <Circle
            {...commonProps}
            x={shape.x + shape.width / 2}
            y={shape.y + shape.height / 2}
            radius={shape.width / 2}
            fill={shape.fill}
          />
        );
      
      case 'ellipse':
        return (
          <Ellipse
            {...commonProps}
            x={shape.x + shape.width / 2}
            y={shape.y + shape.height / 2}
            radiusX={shape.width / 2}
            radiusY={shape.height / 2}
            fill={shape.fill}
            rotation={shape.rotation || 0}
          />
        );
      
      case 'triangle':
        // Use relative coordinates (0-based), centered at origin
        const trianglePoints = [
          shape.width / 2, 0, // Top point (center top)
          0, shape.height, // Bottom left
          shape.width, shape.height, // Bottom right
        ];
        return (
          <Line
            {...commonProps}
            points={trianglePoints}
            closed
            fill={shape.fill}
            rotation={shape.rotation || 0}
            offsetX={shape.width / 2}
            offsetY={shape.height / 2}
            x={shape.x + shape.width / 2}
            y={shape.y + shape.height / 2}
          />
        );
      
      case 'text':
        // Konva Text with separate style, weight, size, and family
        const textFontStyle = shape.fontStyle || 'normal';
        const textFontWeight = shape.fontWeight || 'normal';
        const textFontSize = shape.fontSize || 16;
        const textFontFamily = shape.fontFamily || 'Arial';
        
        // Build font string with style and weight: "italic bold Arial"
        const fontFamilyWithStyles = `${textFontStyle} ${textFontWeight} ${textFontFamily}`;
        
        return (
          <Text
            {...commonProps}
            x={shape.x}
            y={shape.y}
            text={shape.text || 'Double-click to edit'}
            fontSize={textFontSize}
            fontFamily={fontFamilyWithStyles}
            textDecoration={shape.textDecoration || ''}
            fill={shape.fill}
            width={shape.width}
            height={shape.height}
            rotation={shape.rotation || 0}
            align="left"
            verticalAlign="top"
            onDblClick={() => {
              if (!isLockedByOther && onStartEditText) {
                onStartEditText(shape.id);
              }
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}
      
      {/* Show lock indicator text - only when locked by someone else */}
      {isLockedByOther && (
        <Text
          x={shape.x}
          y={shape.y - 20}
          text="🔒 In use by another user"
          fontSize={12}
          fill="#FF3333"
          listening={false}
        />
      )}
      
      {isSelected && !isLockedByOther && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to minimum 5x5
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          resizeEnabled={true}
          keepRatio={false}
          ignoreStroke={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'top-center',
            'middle-left',
            'middle-right',
            'bottom-center',
          ]}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          borderStroke="#0066FF"
          borderStrokeWidth={2}
          anchorFill="#0066FF"
          anchorStroke="#FFFFFF"
          anchorSize={10}
          anchorCornerRadius={5}
          anchorStrokeWidth={2}
          borderDash={[3, 3]}
        />
      )}
    </>
  );
}

