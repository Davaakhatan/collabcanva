import { useState, useEffect } from "react";
import { useCanvas } from "../../contexts/CanvasContext";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from "../../utils/constants";
import { clamp } from "../../utils/helpers";
import { FPSMonitor, generateRandomPosition } from "../../utils/performance";

export default function CanvasControls() {
  const { scale, setScale, resetView, addShape, stageRef, shapes } = useCanvas();
  const [fps, setFps] = useState(60);
  const [showPerf, setShowPerf] = useState(false);

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

  const handleAddShape = () => {
    console.log('Add shape button clicked');
    try {
      // Get center of current viewport
      const stage = stageRef.current;
      if (stage) {
        const centerX = (window.innerWidth / 2 - stage.x()) / scale;
        const centerY = (window.innerHeight / 2 - stage.y()) / scale;
        console.log('Adding shape at:', { x: centerX - 50, y: centerY - 50 });
        addShape('rectangle', { x: centerX - 50, y: centerY - 50 });
      } else {
        // Fallback to default position
        console.log('Adding shape at default position');
        addShape('rectangle');
      }
      console.log('Shape add triggered successfully');
    } catch (error) {
      console.error('Error adding shape:', error);
      alert('Failed to add shape: ' + (error as Error).message);
    }
  };

  const handleStressTest = (count: number) => {
    console.log(`Stress test: Adding ${count} shapes`);
    for (let i = 0; i < count; i++) {
      const pos = generateRandomPosition(CANVAS_WIDTH, CANVAS_HEIGHT);
      addShape('rectangle', pos);
    }
  };

  const zoomPercentage = Math.round(scale * 100);
  const shapeCount = shapes.length;
  
  // FPS health indicator
  const fpsColor = fps >= 55 ? 'text-green-600' : fps >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <>
      {/* Main Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2 z-50">
        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          disabled={scale <= MIN_ZOOM}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">
          {zoomPercentage}%
        </span>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          disabled={scale >= MAX_ZOOM}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Reset View */}
        <button
          onClick={resetView}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
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
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Add Shape */}
        <button
          onClick={handleAddShape}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium text-sm"
          title="Add Rectangle"
        >
          + Add Shape
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Performance Toggle */}
        <button
          onClick={() => setShowPerf(!showPerf)}
          className={`p-2 rounded transition-colors ${showPerf ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
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
      </div>

      {/* Performance Panel */}
      {showPerf && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[300px]">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Performance Monitor</h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">FPS:</span>
              <span className={`text-sm font-bold ${fpsColor}`}>{fps}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shapes:</span>
              <span className="text-sm font-bold text-gray-900">{shapeCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Target:</span>
              <span className="text-sm text-gray-600">60 FPS with 500+ shapes</span>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <p className="text-xs text-gray-500 mb-2">Stress Test:</p>
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

