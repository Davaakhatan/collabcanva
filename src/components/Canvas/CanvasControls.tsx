import { useState, useEffect } from "react";
import { useCanvas } from "../../contexts/CanvasContext";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from "../../utils/constants";
import { clamp } from "../../utils/helpers";
import { FPSMonitor, generateRandomPosition } from "../../utils/performance";
import { exportAsPNG } from "../../utils/export";

interface CanvasControlsProps {
  onShowHelp: () => void;
}

// Unified Button Component
interface TButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

const TButton = ({ onClick, disabled, title, active, children, className = '' }: TButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      w-11 h-11 rounded-xl border flex items-center justify-center
      transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
      disabled:opacity-40 disabled:cursor-not-allowed
      ${active 
        ? 'bg-gradient-to-br from-blue-500/90 to-purple-500/90 text-white border-transparent shadow-md' 
        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95'
      }
      ${className}
    `}
  >
    {children}
  </button>
);

export default function CanvasControls({ onShowHelp }: CanvasControlsProps) {
  const { scale, setScale, resetView, addShape, stageRef, shapes, selectedId, updateShape, bringToFront, sendToBack, undo, redo, canUndo, canRedo } = useCanvas();
  const [fps, setFps] = useState(60);
  const [showPerf, setShowPerf] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<'bottom' | 'left'>('bottom');

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

  useEffect(() => {
    const monitor = new FPSMonitor();
    monitor.start((currentFps) => {
      setFps(currentFps);
    });
    return () => monitor.stop();
  }, []);

  const handleAddShape = (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse') => {
    try {
      const stage = stageRef.current;
      if (stage) {
        const centerX = (window.innerWidth / 2 - stage.x()) / scale;
        const centerY = (window.innerHeight / 2 - stage.y()) / scale;
        addShape(type, { x: centerX - 50, y: centerY - 50 });
      } else {
        addShape(type);
      }
      setShowShapeMenu(false);
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  };

  const shapeTypes = [
    { type: 'rectangle' as const, icon: '⬜', label: 'Rectangle' },
    { type: 'circle' as const, icon: '⚫', label: 'Circle' },
    { type: 'triangle' as const, icon: '▲', label: 'Triangle' },
    { type: 'ellipse' as const, icon: '⬯', label: 'Ellipse' },
    { type: 'text' as const, icon: 'T', label: 'Text' },
  ];

  const handleStressTest = (count: number) => {
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
  const fpsColor = fps >= 55 ? 'text-green-600' : fps >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <>
      {/* Compact Segmented Control for Mode Switch */}
      <div className="fixed top-20 left-6 z-40 flex items-center rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-600/50 shadow-lg overflow-hidden">
        <button
          onClick={() => setToolbarPosition('bottom')}
          className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            toolbarPosition === 'bottom'
              ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Bottom Toolbar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="w-px h-4 bg-gray-200 dark:bg-slate-600" />
        <button
          onClick={() => setToolbarPosition('left')}
          className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            toolbarPosition === 'left'
              ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Sidebar Toolbar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Vertical Toolbar - Hidden on mobile */}
      {toolbarPosition === 'left' && (
        <div 
          className="hidden md:flex fixed left-6 z-40"
          style={{
            top: '96px',
            bottom: 'max(env(safe-area-inset-bottom, 0px), 24px)'
          }}
        >
          <div 
            className="flex flex-col gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-600/50 p-2 overflow-auto overscroll-contain"
            style={{
              maxHeight: 'calc(100vh - 96px - 24px)',
              boxShadow: '0 18px 50px rgba(0,0,0,.12)'
            }}
          >
            {/* Zoom Group - reads as one unit */}
            <div className="flex flex-col items-center gap-2 p-1">
              <TButton onClick={handleZoomOut} disabled={scale <= MIN_ZOOM} title="Zoom Out">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </TButton>
              
              {/* Mini chip for zoom percentage */}
              <div className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-center min-w-[3.5ch]">
                {zoomPercentage}%
              </div>
              
              <TButton onClick={handleZoomIn} disabled={scale >= MAX_ZOOM} title="Zoom In">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </TButton>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Fit/Reset */}
            <TButton onClick={resetView} title="Fit to Screen">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </TButton>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Undo/Redo */}
            <TButton onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </TButton>
            <TButton onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </TButton>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Primary Add Button */}
            <div className="relative">
              <TButton 
                onClick={() => setShowShapeMenu(!showShapeMenu)} 
                active={true}
                title="Add Shape"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </TButton>
              
              {showShapeMenu && (
                <div className="absolute left-full ml-2 top-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 py-2 min-w-[180px] z-50">
                  {shapeTypes.map((shape) => (
                    <button
                      key={shape.type}
                      onClick={() => handleAddShape(shape.type)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <span className="text-lg">{shape.icon}</span>
                      <span>{shape.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Z-index controls (only when shape selected) */}
            {selectedId && (
              <>
                <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />
                <TButton onClick={() => bringToFront(selectedId)} title="Bring to Front">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </TButton>
                <TButton onClick={() => sendToBack(selectedId)} title="Send to Back">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </TButton>

                {/* Color Picker */}
                <div className="relative">
                  <TButton onClick={() => setShowColorPicker(!showColorPicker)} title="Change Color">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </TButton>
                  
                  {showColorPicker && (
                    <div className="absolute left-full ml-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-3 z-50">
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

            {/* Divider */}
            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Analytics/Performance */}
            <TButton 
              onClick={() => setShowPerf(!showPerf)} 
              active={showPerf}
              title="Performance Info"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </TButton>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Image/Export */}
            <TButton onClick={handleExportPNG} title="Export as PNG">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </TButton>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Help */}
            <TButton onClick={onShowHelp} title="Help & Shortcuts">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </TButton>
          </div>
        </div>
      )}

      {/* Bottom Toolbar - Always visible on mobile, visible on desktop when selected */}
      {(toolbarPosition === 'bottom' || window.innerWidth < 768) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:flex">
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-600/50 px-3 py-2 shadow-lg">
            {/* Zoom Group */}
            <TButton onClick={handleZoomOut} disabled={scale <= MIN_ZOOM} title="Zoom Out">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </TButton>
            
            <div className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[4rem] text-center">
              {zoomPercentage}%
            </div>
            
            <TButton onClick={handleZoomIn} disabled={scale >= MAX_ZOOM} title="Zoom In">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </TButton>

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70 mx-1" />

            <TButton onClick={resetView} title="Fit to Screen">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </TButton>

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70 mx-1" />

            <TButton onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </TButton>
            <TButton onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </TButton>

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70 mx-1" />

            <div className="relative">
              <TButton 
                onClick={() => setShowShapeMenu(!showShapeMenu)} 
                active={true}
                title="Add Shape"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </TButton>
              
              {showShapeMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 py-2 min-w-[180px] z-50">
                  {shapeTypes.map((shape) => (
                    <button
                      key={shape.type}
                      onClick={() => handleAddShape(shape.type)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <span className="text-lg">{shape.icon}</span>
                      <span>{shape.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedId && (
              <>
                <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70 mx-1" />
                <TButton onClick={() => bringToFront(selectedId)} title="Bring to Front">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </TButton>
                <TButton onClick={() => sendToBack(selectedId)} title="Send to Back">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </TButton>

                <div className="relative">
                  <TButton onClick={() => setShowColorPicker(!showColorPicker)} title="Change Color">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </TButton>
                  
                  {showColorPicker && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-3 z-50">
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

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70 mx-1" />

            <TButton 
              onClick={() => setShowPerf(!showPerf)} 
              active={showPerf}
              title="Performance Info"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </TButton>

            <TButton onClick={handleExportPNG} title="Export as PNG">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </TButton>

            <TButton onClick={onShowHelp} title="Help & Shortcuts">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </TButton>
          </div>
        </div>
      )}

      {/* Performance Panel */}
      {showPerf && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-600/50 p-5 z-50 min-w-[320px]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Performance Monitor
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">FPS</span>
              <span className={`text-lg font-bold ${fpsColor}`}>{fps}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Shapes</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{shapeCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Zoom</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{zoomPercentage}%</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Stress Test</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleStressTest(100)} className="px-3 py-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">+100</button>
              <button onClick={() => handleStressTest(500)} className="px-3 py-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors">+500</button>
              <button onClick={() => handleStressTest(1000)} className="px-3 py-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">+1K</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
