import { useEffect, useRef } from "react";
import { Rect, Transformer, Text } from "react-konva";
import type Konva from "konva";
import { useAuth } from "../../contexts/AuthContext";
import type { Shape as ShapeType } from "../../contexts/CanvasContext";

interface ShapeProps {
  shape: ShapeType;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<ShapeType>) => void;
  onLock: () => Promise<boolean>;
  onUnlock: () => void;
}

export default function Shape({ shape, isSelected, onSelect, onChange, onLock, onUnlock }: ShapeProps) {
  const { user } = useAuth();
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  // Check if locked by someone else
  const userId = (user as any)?.uid || null;
  const isLockedByOther = shape.isLocked && shape.lockedBy !== userId;
  const isLockedByMe = shape.isLocked && shape.lockedBy === userId;

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current && !isLockedByOther) {
      // Attach transformer to the shape
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isLockedByOther]);

  const handleDragStart = async () => {
    // Lock the shape when starting to drag
    if (!isLockedByMe) {
      await onLock();
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
    // Unlock after drag
    onUnlock();
  };

  const handleTransformStart = async () => {
    // Lock the shape when starting to transform
    if (!isLockedByMe) {
      await onLock();
    }
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

    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: rotation,
    });
    
    // Unlock after transform
    onUnlock();
  };

  // Determine stroke color based on lock state
  let strokeColor = undefined;
  let strokeWidth = 0;
  
  if (isSelected) {
    strokeColor = '#0066FF';
    strokeWidth = 2;
  } else if (isLockedByOther) {
    strokeColor = '#FF3333'; // Red for locked by others
    strokeWidth = 2;
  } else if (isLockedByMe) {
    strokeColor = '#33FF57'; // Green for locked by me
    strokeWidth = 2;
  }

  return (
    <>
      <Rect
        ref={shapeRef}
        {...shape}
        draggable={!isLockedByOther}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={isLockedByOther ? 0.6 : 1}
      />
      
      {/* Show lock indicator text */}
      {shape.isLocked && (
        <Text
          x={shape.x}
          y={shape.y - 20}
          text={`🔒 ${isLockedByMe ? 'You' : 'Locked'}`}
          fontSize={12}
          fill={isLockedByMe ? '#33FF57' : '#FF3333'}
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
          anchorSize={8}
          anchorCornerRadius={4}
        />
      )}
    </>
  );
}

