import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCanvas } from "../../contexts/CanvasContext";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from "../../utils/constants";
import { clamp } from "../../utils/helpers";
import { FPSMonitor, generateRandomPosition } from "../../utils/performance";
import { exportAsPNG } from "../../utils/export";

interface CanvasControlsProps {
  onShowHelp: () => void;
}

// Unified Button Component with responsive sizing
interface TButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

const TButton = ({ onClick, disabled, title, active, children, className = '', 'aria-label': ariaLabel, buttonRef }: TButtonProps) => (
  <button
    ref={buttonRef}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={ariaLabel || title}
    className={`
      size-12 rounded-xl border flex items-center justify-center shrink-0
      transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
      disabled:opacity-40 disabled:cursor-not-allowed
      ${active 
        ? 'bg-gradient-to-br from-blue-500/90 to-purple-500/90 text-white border-transparent shadow-md focus-visible:ring-2 ring-blue-500/40' 
        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95'
      }
      ${className}
    `}
  >
    {children}
  </button>
);

// Single Pill Toggle Component
interface ToolbarToggleProps {
  state: 'bottom' | 'left';
  onToggle: () => void;
}

const ToolbarToggle = ({ state, onToggle }: ToolbarToggleProps) => {
  const isBottom = state === 'bottom';
  
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isBottom}
      title={isBottom ? 'Move toolbar to sidebar' : 'Move toolbar to bottom'}
      className="absolute top-20 left-6 z-40 inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-slate-800 shadow-md border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 focus-visible:ring-2 ring-blue-500/40 transition-all duration-150 w-auto"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      {isBottom ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
};

// Unified Shape Menu Component (Portal-based)
interface ShapeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (type: 'rectangle' | 'circle' | 'triangle' | 'text' | 'ellipse') => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  mode: 'bottom' | 'left';
}

const ShapeMenu = ({ isOpen, onClose, onSelectShape, anchorRef, mode }: ShapeMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const shapeTypes = [
    { type: 'rectangle' as const, icon: '⬜', label: 'Rectangle' },
    { type: 'circle' as const, icon: '⚫', label: 'Circle' },
    { type: 'triangle' as const, icon: '▲', label: 'Triangle' },
    { type: 'ellipse' as const, icon: '⬯', label: 'Ellipse' },
    { type: 'text' as const, icon: 'T', label: 'Text' },
  ];

  // Calculate position
  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const anchor = anchorRef.current.getBoundingClientRect();
    const collisionPadding = 12;

    if (mode === 'bottom') {
      // Open upward from bottom toolbar
      setPosition({
        left: anchor.left + anchor.width / 2,
        top: anchor.top - collisionPadding
      });
    } else {
      // Open to the right of vertical toolbar
      setPosition({
        left: anchor.right + collisionPadding,
        top: anchor.top
      });
    }
  }, [isOpen, anchorRef, mode]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  // Focus first item on open
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstButton = menuRef.current.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuStyle = mode === 'bottom'
    ? { bottom: `${window.innerHeight - position.top}px`, left: `${position.left}px`, transform: 'translateX(-50%)' }
    : { top: `${position.top}px`, left: `${position.left}px` };

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 pointer-events-auto"
      style={menuStyle}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-600 py-2 min-w-[280px] max-w-none max-h-[calc(100vh-160px)] overflow-y-auto overflow-x-hidden overscroll-contain">
        {shapeTypes.map((shape) => (
          <button
            key={shape.type}
            onClick={() => {
              onSelectShape(shape.type);
              onClose();
            }}
            role="menuitem"
            tabIndex={0}
            className="w-full h-10 px-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700 focus-visible:outline-none rounded-md mx-1 transition-colors"
          >
            <div className="size-9 rounded-md bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <span className="w-9 h-9 flex items-center justify-center text-xl">{shape.icon}</span>
            </div>
            <span className="text-[15px] leading-none font-medium text-gray-700 dark:text-gray-200">{shape.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default function CanvasControls({ onShowHelp }: CanvasControlsProps) {
  const { scale, setScale, resetView, addShape, stageRef, shapes, selectedId, updateShape, undo, redo, canUndo, canRedo } = useCanvas();
  const [fps, setFps] = useState(60);
  const [showPerf, setShowPerf] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<'bottom' | 'left'>('bottom');
  
  const addShapeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Movement functions
  const moveShape = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedId) return;
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    
    const moveDistance = 10; // Move 10px at a time
    let newX = shape.x;
    let newY = shape.y;
    
    switch (direction) {
      case 'up':
        newY -= moveDistance;
        break;
      case 'down':
        newY += moveDistance;
        break;
      case 'left':
        newX -= moveDistance;
        break;
      case 'right':
        newX += moveDistance;
        break;
    }
    
    updateShape(selectedId, { x: newX, y: newY });
  };
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);

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
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  };

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
      {/* Single Pill Toggle */}
      <ToolbarToggle 
        state={toolbarPosition} 
        onToggle={() => setToolbarPosition(toolbarPosition === 'bottom' ? 'left' : 'bottom')} 
      />

      {/* Vertical Toolbar - Hidden on mobile */}
      {toolbarPosition === 'left' && (
        <div 
          className="hidden md:block fixed left-6 z-40 overflow-visible"
          style={{
            top: '120px',
            bottom: 'max(env(safe-area-inset-bottom, 0px), 24px)'
          }}
        >
          <div 
            className="vertical-toolbar-container flex flex-col gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-600/50 p-2 overflow-x-hidden overflow-y-auto w-[64px] overscroll-contain max-h-full"
            style={{
              boxShadow: '0 18px 50px rgba(0,0,0,.12)'
            }}
          >
            {/* Zoom Group */}
            <div className="flex flex-col items-center gap-2">
              <TButton onClick={handleZoomOut} disabled={scale <= MIN_ZOOM} title="Zoom Out" aria-label="Zoom Out">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </TButton>
              
              <div className="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-center min-w-[3.5ch]">
                {zoomPercentage}%
              </div>
              
              <TButton onClick={handleZoomIn} disabled={scale >= MAX_ZOOM} title="Zoom In" aria-label="Zoom In">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </TButton>
            </div>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={resetView} title="Fit to Screen" aria-label="Fit to Screen">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </TButton>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)" aria-label="Undo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </TButton>
            <TButton onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)" aria-label="Redo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </TButton>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />
            
            {/* Movement Controls */}
            {selectedId && (
              <>
                <TButton onClick={() => moveShape('up')} title="Move Up" aria-label="Move Up">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('down')} title="Move Down" aria-label="Move Down">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('left')} title="Move Left" aria-label="Move Left">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('right')} title="Move Right" aria-label="Move Right">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </TButton>
                <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />
              </>
            )}

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            {/* Primary Add Button */}
            <TButton 
              buttonRef={addShapeButtonRef}
              onClick={() => setShowShapeMenu(prev => !prev)} 
              active={true}
              title="Add Shape"
              aria-label="Add Shape"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </TButton>

            {selectedId && (
              <>
                <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />
                <TButton 
                  buttonRef={colorPickerButtonRef}
                  onClick={() => setShowColorPicker(prev => !prev)} 
                  title="Change Color" 
                  aria-label="Change Color"
                >
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </TButton>
              </>
            )}

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton 
              onClick={() => setShowPerf(!showPerf)} 
              active={showPerf}
              title="Performance Info"
              aria-label="Performance Info"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </TButton>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={handleExportPNG} title="Export as PNG" aria-label="Export as PNG">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </TButton>

            <div className="w-full h-px bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={onShowHelp} title="Help & Shortcuts" aria-label="Help & Shortcuts">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </TButton>
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      {toolbarPosition === 'bottom' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-600/50 px-3 py-2 shadow-lg">
            <TButton onClick={handleZoomOut} disabled={scale <= MIN_ZOOM} title="Zoom Out" aria-label="Zoom Out">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </TButton>
            
            <div className="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[3.5rem] text-center rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
              {zoomPercentage}%
            </div>
            
            <TButton onClick={handleZoomIn} disabled={scale >= MAX_ZOOM} title="Zoom In" aria-label="Zoom In">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </TButton>

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={resetView} title="Fit to Screen" aria-label="Fit to Screen">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </TButton>

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)" aria-label="Undo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </TButton>
            <TButton onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)" aria-label="Redo">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </TButton>

            {/* Movement Controls */}
            {selectedId && (
              <>
                <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />
                <TButton onClick={() => moveShape('up')} title="Move Up" aria-label="Move Up">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('down')} title="Move Down" aria-label="Move Down">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('left')} title="Move Left" aria-label="Move Left">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </TButton>
                <TButton onClick={() => moveShape('right')} title="Move Right" aria-label="Move Right">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </TButton>
              </>
            )}

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton 
              buttonRef={addShapeButtonRef}
              onClick={() => setShowShapeMenu(prev => !prev)} 
              active={true}
              title="Add Shape"
              aria-label="Add Shape"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </TButton>

            {selectedId && (
              <>
                <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />
                <TButton 
                  buttonRef={colorPickerButtonRef}
                  onClick={() => setShowColorPicker(prev => !prev)} 
                  title="Change Color" 
                  aria-label="Change Color"
                >
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </TButton>
              </>
            )}

            <div className="w-px h-6 bg-gray-200/70 dark:bg-slate-600/70" />

            <TButton 
              onClick={() => setShowPerf(!showPerf)} 
              active={showPerf}
              title="Performance Info"
              aria-label="Performance Info"
            >
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </TButton>

            <TButton onClick={handleExportPNG} title="Export as PNG" aria-label="Export as PNG">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </TButton>

            <TButton onClick={onShowHelp} title="Help & Shortcuts" aria-label="Help & Shortcuts">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </TButton>
          </div>
        </div>
      )}

      {/* Unified Shape Menu Portal */}
      <ShapeMenu
        isOpen={showShapeMenu}
        onClose={() => setShowShapeMenu(false)}
        onSelectShape={handleAddShape}
        anchorRef={addShapeButtonRef}
        mode={toolbarPosition}
      />

      {/* Color Picker Portal (for selected shapes) */}
      {showColorPicker && selectedId && colorPickerButtonRef.current && createPortal(
        <div
          className="fixed z-50 pointer-events-auto"
          style={{
            left: toolbarPosition === 'left' 
              ? `${colorPickerButtonRef.current.getBoundingClientRect().right + 12}px`
              : `${colorPickerButtonRef.current.getBoundingClientRect().left + colorPickerButtonRef.current.getBoundingClientRect().width / 2}px`,
            top: toolbarPosition === 'left'
              ? `${colorPickerButtonRef.current.getBoundingClientRect().top}px`
              : 'auto',
            bottom: toolbarPosition === 'bottom'
              ? `${window.innerHeight - colorPickerButtonRef.current.getBoundingClientRect().top + 12}px`
              : 'auto',
            transform: toolbarPosition === 'bottom' ? 'translateX(-50%)' : 'none'
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-600 p-3"
            onClick={(e) => e.stopPropagation()}
          >
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
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
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
