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
    ? 'fixed bottom-6 left-1/2 -translate-x-1/2 flex-row items-center'
    : 'fixed left-6 top-1/2 -translate-y-1/2 flex-col items-center max-h-[calc(100vh-180px)] overflow-y-auto';

  const dividerClasses = toolbarPosition === 'bottom'
    ? 'w-px h-5 bg-gray-200 dark:bg-slate-600 mx-2'
    : 'h-px w-full bg-gray-200 dark:bg-slate-600 my-3';
    
  const buttonBaseClasses = "p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 text-gray-700 dark:text-gray-200 flex items-center justify-center group relative";
  
  const iconSize = "w-5 h-5";

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
      <div className={`${positionClasses} bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 ${toolbarPosition === 'bottom' ? 'px-4 py-3 gap-1' : 'px-3 py-4 gap-0 w-[60px] toolbar-scrollable'} flex z-50 transition-all duration-300`}>
        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          disabled={scale <= MIN_ZOOM}
          className={buttonBaseClasses}
          title="Zoom Out"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>

        {/* Zoom Percentage */}
        <div className={`${toolbarPosition === 'bottom' ? 'px-2' : 'py-2 w-full'} flex items-center justify-center`}>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {zoomPercentage}%
          </span>
        </div>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          disabled={scale >= MAX_ZOOM}
          className={buttonBaseClasses}
          title="Zoom In"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        {/* Divider */}
        <div className={dividerClasses} />

        {/* Reset View */}
        <button
          onClick={resetView}
          className={buttonBaseClasses}
          title="Reset View"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Divider */}
        <div className={dividerClasses} />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={buttonBaseClasses}
          title="Undo (Cmd+Z)"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={buttonBaseClasses}
          title="Redo (Cmd+Shift+Z)"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        {/* Divider */}
        <div className={dividerClasses} />

        {/* Add Shape Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-md transition-all duration-150 flex items-center justify-center"
            title="Add Shape"
          >
            <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className={buttonBaseClasses}
              title="Bring to Front"
            >
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </button>
            <button
              onClick={() => sendToBack(selectedId)}
              className={buttonBaseClasses}
              title="Send to Back"
            >
              <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </button>
            
            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={buttonBaseClasses}
                title="Change Color"
              >
                <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className={`${buttonBaseClasses} ${showPerf ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
          title="Performance Info"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        {/* Export PNG Button */}
        <button
          onClick={handleExportPNG}
          className={buttonBaseClasses}
          title="Export as PNG (High Quality)"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Help Button */}
        <button
          onClick={onShowHelp}
          className={buttonBaseClasses}
          title="Show Help (Keyboard Shortcuts)"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

