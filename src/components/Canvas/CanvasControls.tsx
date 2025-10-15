import { useState, useEffect } from "react";
import { useCanvas } from "../../contexts/CanvasContext";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from "../../utils/constants";
import { clamp } from "../../utils/helpers";
import { FPSMonitor, generateRandomPosition } from "../../utils/performance";
import { exportAsPNG } from "../../utils/export";

interface CanvasControlsProps {
  onShowHelp: () => void;
}

export default function CanvasControls({ onShowHelp }: CanvasControlsProps) {
  const { scale, setScale, resetView, addShape, stageRef, shapes, selectedId, updateShape, bringToFront, sendToBack, undo, redo, canUndo, canRedo } = useCanvas();
  const [fps, setFps] = useState(60);
  const [showPerf, setShowPerf] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<'bottom' | 'left'>('bottom'); // Toggle between bottom and left

  // Predefined color palette
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#EF476F', '#06FFA5', '#118AB2', '#FFD166', '#A78BFA',
  ];

  const handleZoomIn = () => {
    const newScale = clamp(scale * (1 + ZOOM_SPEED), MIN_ZOOM, MAX_ZOOM);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = clamp(scale / (1 + ZOOM_SPEED), MIN_ZOOM, MAX_ZOOM);
    setScale(newScale);
  };

  // FPS Monitoring
  useEffect(() => {
    const monitor = new FPSMonitor();
    monitor.start((currentFps) => {
      setFps(currentFps);
    });
    return () => monitor.stop();
  }, []);

  const handleAddShape = (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse') => {
    console.log('Add shape button clicked:', type);
    try {
      // Get center of current viewport
      const stage = stageRef.current;
      if (stage) {
        const centerX = (window.innerWidth / 2 - stage.x()) / scale;
        const centerY = (window.innerHeight / 2 - stage.y()) / scale;
        console.log('Adding shape at:', { x: centerX - 50, y: centerY - 50 });
        addShape(type, { x: centerX - 50, y: centerY - 50 });
      } else {
        // Fallback to default position
        console.log('Adding shape at default position');
        addShape(type);
      }
      console.log('Shape add triggered successfully');
      setShowShapeMenu(false);
    } catch (error) {
      console.error('Error adding shape:', error);
      alert('Failed to add shape: ' + (error as Error).message);
    }
  };

  const shapeTypes = [
    { type: 'rectangle' as const, icon: '⬜', label: 'Rectangle' },
    { type: 'circle' as const, icon: '⚫', label: 'Circle' },
    { type: 'triangle' as const, icon: '▲', label: 'Triangle' },
    { type: 'ellipse' as const, icon: '⬯', label: 'Ellipse' }, // Better visible ellipse icon
    { type: 'text' as const, icon: 'T', label: 'Text' },
  ];

  const handleStressTest = (count: number) => {
    console.log(`Stress test: Adding ${count} shapes`);
    for (let i = 0; i < count; i++) {
      const pos = generateRandomPosition(CANVAS_WIDTH, CANVAS_HEIGHT);
      addShape('rectangle', pos);
    }
  };

  const handleExportPNG = () => {
    const stage = stageRef.current;
    if (stage) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      exportAsPNG(stage, `collabcanvas-${timestamp}.png`);
    }
  };

  const zoomPercentage = Math.round(scale * 100);
  const shapeCount = shapes.length;
  
  // FPS health indicator
  const fpsColor = fps >= 55 ? 'text-green-600' : fps >= 40 ? 'text-yellow-600' : 'text-red-600';

  // Dynamic positioning based on toolbar position
  const positionClasses = toolbarPosition === 'bottom'
    ? 'fixed bottom-6 left-1/2 -translate-x-1/2 flex-row'
    : 'fixed left-6 top-20 flex-col max-h-[calc(100vh-120px)] overflow-y-auto w-16';

  const dividerClasses = toolbarPosition === 'bottom'
    ? 'w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1'
    : 'h-px w-12 bg-gray-300 dark:bg-slate-600 my-2';

  return (
    <>
      {/* Intuitive Position Toggle Button */}
      <button
        onClick={() => setToolbarPosition(toolbarPosition === 'bottom' ? 'left' : 'bottom')}
        className="fixed top-20 left-6 px-3 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 dark:border-slate-600/50 hover:scale-105 transition-all duration-200 z-50 text-gray-700 dark:text-gray-200 flex items-center gap-2"
        title={toolbarPosition === 'bottom' ? 'Move toolbar to left sidebar' : 'Move toolbar to bottom'}
      >
        {toolbarPosition === 'bottom' ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
            </svg>
            <span className="text-xs font-medium">Sidebar</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs font-medium">Bottom</span>
          </>
        )}
      </button>
      
      {/* Unified Toolbar */}
      <div className={`${positionClasses} bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 p-4 flex ${toolbarPosition === 'left' ? 'gap-3' : 'gap-2'} z-50`}>
        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          disabled={scale <= MIN_ZOOM}
          className={`${toolbarPosition === 'left' ? 'w-full' : ''} p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200 flex items-center justify-center`}
          title="Zoom Out"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        </button>

        {/* Zoom Percentage */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[4rem] text-center">
          {zoomPercentage}%
        </span>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          disabled={scale >= MAX_ZOOM}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
          title="Zoom In"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </button>

        {/* Divider */}
        <div className={dividerClasses} />

        {/* Reset View */}
        <button
          onClick={resetView}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors text-gray-700 dark:text-gray-200"
          title="Reset View"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>

        {/* Divider */}
        <div className={dividerClasses} />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
          title="Undo (Cmd+Z)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
          title="Redo (Cmd+Shift+Z)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
            />
          </svg>
        </button>

        {/* Divider */}
        <div className={dividerClasses} />

        {/* Add Shape Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            className={`p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 transform flex items-center justify-center ${toolbarPosition === 'left' ? 'w-full' : ''}`}
            title="Add Shape"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showShapeMenu && (
            <div className={`absolute ${toolbarPosition === 'bottom' ? 'bottom-full mb-2' : 'left-full ml-2'} bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 py-2 min-w-[180px] z-50`}>
              {shapeTypes.map((shape) => (
                <button
                  key={shape.type}
                  onClick={() => handleAddShape(shape.type)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-colors flex items-center gap-3 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{shape.icon}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{shape.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Z-index controls (only show when shape is selected) */}
        {selectedId && (
          <>
            <div className={dividerClasses} />
            <button
              onClick={() => bringToFront(selectedId)}
              className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-orange-100 hover:to-yellow-100 dark:hover:from-orange-900/30 dark:hover:to-yellow-900/30 hover:text-orange-700 dark:hover:text-orange-400 transition-all duration-200 text-gray-700 dark:text-gray-200"
              title="Bring to Front"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </button>
            <button
              onClick={() => sendToBack(selectedId)}
              className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-orange-100 hover:to-yellow-100 dark:hover:from-orange-900/30 dark:hover:to-yellow-900/30 hover:text-orange-700 dark:hover:text-orange-400 transition-all duration-200 text-gray-700 dark:text-gray-200"
              title="Send to Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </button>
            
            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30 hover:text-pink-700 dark:hover:text-pink-400 transition-all duration-200 text-gray-700 dark:text-gray-200"
                title="Change Color"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              
              {showColorPicker && (
                <div className={`absolute ${toolbarPosition === 'bottom' ? 'bottom-full mb-2' : 'left-full ml-2'} bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 p-3 z-50`}>
                  <div className="grid grid-cols-5 gap-2">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          updateShape(selectedId, { fill: color });
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-slate-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className={dividerClasses} />

        {/* Performance Toggle */}
        <button
          onClick={() => setShowPerf(!showPerf)}
          className={`p-2 rounded-xl transition-all duration-200 ${showPerf ? 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200'}`}
          title="Performance Info"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>

        {/* Export PNG Button */}
        <button
          onClick={handleExportPNG}
          className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-green-100 hover:to-teal-100 hover:text-green-700 transition-all duration-200"
          title="Export as PNG (High Quality)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Help Button */}
        <button
          onClick={onShowHelp}
          className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-blue-100 hover:to-purple-100 hover:text-blue-700 transition-all duration-200"
          title="Show Help (Keyboard Shortcuts)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {/* Performance Panel */}
      {showPerf && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 p-5 z-50 min-w-[320px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Performance Monitor
          </h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">FPS:</span>
              <span className={`text-sm font-bold ${fpsColor}`}>{fps}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Shapes:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{shapeCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Target:</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">60 FPS with 500+ shapes</span>
            </div>
          </div>

          <div className="border-t dark:border-slate-600 pt-3 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Stress Test:</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleStressTest(50)}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                +50
              </button>
              <button
                onClick={() => handleStressTest(100)}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                +100
              </button>
              <button
                onClick={() => handleStressTest(200)}
                className="flex-1 px-3 py-1.5 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
              >
                +200
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

