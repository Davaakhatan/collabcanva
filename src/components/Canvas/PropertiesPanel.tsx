// PropertiesPanel component for editing selected shape properties
// Provides a comprehensive interface for editing all shape properties

import React, { useState, useRef, useEffect } from 'react';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';
import AdvancedColorPicker from './AdvancedColorPicker';
import type { Shape } from '../../contexts/ProjectCanvasContext';

interface PropertiesPanelProps {
  className?: string;
}

export default function PropertiesPanel({ className = '' }: PropertiesPanelProps) {
  const { 
    shapes, 
    selectedIds, 
    updateShape, 
    batchUpdateShapes, 
    pushState 
  } = useProjectCanvas();

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
  const [colorPickerProperty, setColorPickerProperty] = useState<'fill' | 'stroke'>('fill');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the first selected shape for property editing
  const selectedShape = selectedIds.length > 0 
    ? shapes.find(shape => shape.id === selectedIds[0]) 
    : null;

  // Handle panel dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Property update handlers
  const handlePropertyChange = (property: string, value: any) => {
    if (!selectedShape) return;

    // Update the shape
    updateShape(selectedShape.id, { [property]: value });
    
    // Save to history
    pushState();
  };

  const handleBatchPropertyChange = (property: string, value: any) => {
    if (selectedIds.length === 0) return;

    // Batch update all selected shapes
    const updates = selectedIds.map(id => ({ id, updates: { [property]: value } }));
    batchUpdateShapes(updates);
    
    // Save to history
    pushState();
  };

  // Debug logging
  console.log('🔧 [PropertiesPanel] Render check:', { 
    selectedIds, 
    selectedShape: selectedShape?.id, 
    shapesCount: shapes.length,
    allShapes: shapes.map(s => ({ id: s.id, type: s.type }))
  });

  // Don't render if no shape is selected
  if (!selectedShape) {
    console.log('🔧 [PropertiesPanel] No shape selected, not rendering');
    // For debugging: show a placeholder when no shape is selected
    return (
      <div className="absolute bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 w-72 z-50" style={{ left: position.x, top: position.y }}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No shape selected</p>
          <p className="text-xs mt-1">Click on a shape to edit its properties</p>
        </div>
      </div>
    );
  }

  console.log('🔧 [PropertiesPanel] Rendering panel for shape:', selectedShape.id);

  return (
    <div
      ref={containerRef}
      className={`fixed bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-blue-500 p-4 z-[9999] w-[320px] max-h-[calc(100vh-120px)] overflow-y-auto ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Header - Draggable area */}
      <div 
        className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-slate-600 cursor-grab active:cursor-grabbing select-none drag-handle"
        onMouseDown={handleMouseDown}
      >
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Properties</h3>
        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {selectedIds.length > 1 ? `${selectedIds.length} selected` : selectedShape.type}
        </div>
      </div>

      {/* Debug indicator */}
      <div className="mb-2 p-2 bg-green-100 dark:bg-green-900 rounded text-xs">
        ✅ PropertiesPanel is working! Shape: {selectedShape.id}
      </div>

      {/* Properties Content */}
      <div className="space-y-4">
        {/* Position & Size */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Position & Size</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedShape.x)}
                onChange={(e) => handlePropertyChange('x', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.y)}
                onChange={(e) => handlePropertyChange('y', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
              <input
                type="number"
                value={Math.round(selectedShape.width)}
                onChange={(e) => handlePropertyChange('width', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedShape.height)}
                onChange={(e) => handlePropertyChange('height', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Rotation</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                value={selectedShape.rotation || 0}
                onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={Math.round(selectedShape.rotation || 0)}
                onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Visual Properties */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Visual</h4>
          
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fill Color</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setColorPickerProperty('fill');
                  setShowAdvancedColorPicker(true);
                }}
                className="w-8 h-8 border border-gray-300 dark:border-slate-600 rounded cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: selectedShape.fill }}
                title="Open advanced color picker"
              />
              <input
                type="text"
                value={selectedShape.fill}
                onChange={(e) => handleBatchPropertyChange('fill', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Stroke Color</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setColorPickerProperty('stroke');
                  setShowAdvancedColorPicker(true);
                }}
                className="w-8 h-8 border border-gray-300 dark:border-slate-600 rounded cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: selectedShape.stroke || '#000000' }}
                title="Open advanced color picker"
              />
              <input
                type="text"
                value={selectedShape.stroke || ''}
                onChange={(e) => handleBatchPropertyChange('stroke', e.target.value)}
                placeholder="No stroke"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Stroke Width</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={selectedShape.strokeWidth || 0}
                onChange={(e) => handleBatchPropertyChange('strokeWidth', parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={selectedShape.strokeWidth || 0}
                onChange={(e) => handleBatchPropertyChange('strokeWidth', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Transform Properties */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Transform</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Scale X</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={selectedShape.scaleX || 1}
                  onChange={(e) => handlePropertyChange('scaleX', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  value={Math.round((selectedShape.scaleX || 1) * 100) / 100}
                  onChange={(e) => handlePropertyChange('scaleX', parseFloat(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Scale Y</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={selectedShape.scaleY || 1}
                  onChange={(e) => handlePropertyChange('scaleY', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  value={Math.round((selectedShape.scaleY || 1) * 100) / 100}
                  onChange={(e) => handlePropertyChange('scaleY', parseFloat(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Text-specific properties */}
        {selectedShape.type === 'text' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Text</h4>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Content</label>
              <textarea
                value={selectedShape.text || ''}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Size</label>
                <input
                  type="number"
                  value={selectedShape.fontSize || 16}
                  onChange={(e) => handlePropertyChange('fontSize', parseFloat(e.target.value) || 16)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Family</label>
                <select
                  value={selectedShape.fontFamily || 'Arial'}
                  onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedShape.fontWeight === 'bold'}
                  onChange={(e) => handlePropertyChange('fontWeight', e.target.checked ? 'bold' : 'normal')}
                  className="rounded"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Bold</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedShape.fontStyle === 'italic'}
                  onChange={(e) => handlePropertyChange('fontStyle', e.target.checked ? 'italic' : 'normal')}
                  className="rounded"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Italic</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedShape.textDecoration === 'underline'}
                  onChange={(e) => handlePropertyChange('textDecoration', e.target.checked ? 'underline' : 'none')}
                  className="rounded"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Underline</span>
              </label>
            </div>
          </div>
        )}

        {/* Shape-specific properties */}
        {selectedShape.type === 'star' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Star</h4>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Points</label>
              <input
                type="number"
                min="3"
                max="20"
                value={selectedShape.numPoints || 5}
                onChange={(e) => handlePropertyChange('numPoints', parseInt(e.target.value) || 5)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Inner Radius</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={selectedShape.innerRadius || 0.4}
                  onChange={(e) => handlePropertyChange('innerRadius', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  value={Math.round((selectedShape.innerRadius || 0.4) * 100) / 100}
                  onChange={(e) => handlePropertyChange('innerRadius', parseFloat(e.target.value) || 0.4)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        )}

        {selectedShape.type === 'polygon' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Polygon</h4>
            
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Sides</label>
              <input
                type="number"
                min="3"
                max="20"
                value={selectedShape.sides || 6}
                onChange={(e) => handlePropertyChange('sides', parseInt(e.target.value) || 6)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Color Picker Modal */}
      {showAdvancedColorPicker && selectedShape && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-[60]"
          onClick={(e) => {
            // Only close if clicking on the backdrop, not on the color picker itself
            if (e.target === e.currentTarget) {
              setShowAdvancedColorPicker(false);
            }
          }}
        >
          <AdvancedColorPicker
            selectedShape={selectedShape}
            targetProperty={colorPickerProperty}
            onColorChange={(property, value) => {
              // Apply the color change to the correct property
              handleBatchPropertyChange(property, value);
            }}
            onClose={() => setShowAdvancedColorPicker(false)}
            className="relative"
          />
        </div>
      )}
    </div>
  );
}
