import React from 'react';
import { useProjectCanvas } from '../../contexts/ProjectCanvasContext';

interface SimplePropertiesPanelProps {
  className?: string;
}

export default function SimplePropertiesPanel({ className = '' }: SimplePropertiesPanelProps) {
  const { 
    shapes, 
    selectedIds, 
    updateShape
  } = useProjectCanvas();

  const selectedShape = shapes.find(shape => selectedIds.includes(shape.id));

  // Debug logging
  console.log('🔧 [SimplePropertiesPanel] Render check:', { 
    selectedIds, 
    selectedShape: selectedShape?.id, 
    shapesCount: shapes.length
  });

  // Don't render if no shape is selected
  if (!selectedShape) {
    console.log('🔧 [SimplePropertiesPanel] No shape selected, showing placeholder');
    return (
      <div className="fixed top-4 right-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 w-72 z-[9999] border-2 border-blue-500">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm font-bold">No shape selected</p>
          <p className="text-xs mt-1">Click on a shape to edit its properties</p>
        </div>
      </div>
    );
  }

  console.log('🔧 [SimplePropertiesPanel] Rendering panel for shape:', selectedShape.id);

  return (
    <div className={`fixed top-4 right-4 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 w-72 z-[9999] border-2 border-blue-500 ${className}`}>
      {/* Debug indicator */}
      <div className="mb-2 p-2 bg-green-100 dark:bg-green-900 rounded text-xs">
        ✅ SimplePropertiesPanel is working! Shape: {selectedShape.id}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-slate-600">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Properties</h3>
        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {selectedShape.type}
        </div>
      </div>

      {/* Basic Properties */}
      <div className="space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">X</label>
              <input
                type="number"
                value={Math.round(selectedShape.x || 0)}
                onChange={(e) => updateShape(selectedShape.id, { x: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.y || 0)}
                onChange={(e) => updateShape(selectedShape.id, { y: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Size</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
              <input
                type="number"
                value={Math.round(selectedShape.width || 0)}
                onChange={(e) => updateShape(selectedShape.id, { width: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Height</label>
              <input
                type="number"
                value={Math.round(selectedShape.height || 0)}
                onChange={(e) => updateShape(selectedShape.id, { height: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Fill Color */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Fill Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedShape.fill || '#000000'}
              onChange={(e) => updateShape(selectedShape.id, { fill: e.target.value })}
              className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedShape.fill || '#000000'}
              onChange={(e) => updateShape(selectedShape.id, { fill: e.target.value })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Stroke Color */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stroke Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedShape.stroke || '#000000'}
              onChange={(e) => updateShape(selectedShape.id, { stroke: e.target.value })}
              className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedShape.stroke || '#000000'}
              onChange={(e) => updateShape(selectedShape.id, { stroke: e.target.value })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Stroke Width</label>
          <input
            type="number"
            value={selectedShape.strokeWidth || 0}
            onChange={(e) => updateShape(selectedShape.id, { strokeWidth: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
    </div>
  );
}
