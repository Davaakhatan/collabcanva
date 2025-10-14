import { useCanvas } from "../../contexts/CanvasContext";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED } from "../../utils/constants";
import { clamp } from "../../utils/helpers";

export default function CanvasControls() {
  const { scale, setScale, resetView, addShape, stageRef } = useCanvas();

  const handleZoomIn = () => {
    const newScale = clamp(scale * (1 + ZOOM_SPEED), MIN_ZOOM, MAX_ZOOM);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = clamp(scale / (1 + ZOOM_SPEED), MIN_ZOOM, MAX_ZOOM);
    setScale(newScale);
  };

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

  const zoomPercentage = Math.round(scale * 100);

  return (
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
    </div>
  );
}

