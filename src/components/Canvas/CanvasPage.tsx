import { useState } from "react";
import Navbar from "../Layout/Navbar";
import Canvas from "./Canvas";
import CanvasControls from "./CanvasControls";
import HelpOverlay from "./HelpOverlay";
import AICommandPanel from "../AI/AICommandPanel";
import { CanvasProvider } from "../../contexts/CanvasContext";

export default function CanvasPage() {
  const [showHelp, setShowHelp] = useState(false);

  const handleShowHelp = () => setShowHelp(true);

  return (
    <CanvasProvider>
      <div className="relative w-full h-screen overflow-hidden">
        <Navbar />
        <div className="pt-16">
          <Canvas onShowHelp={handleShowHelp} />
          <CanvasControls onShowHelp={handleShowHelp} />
          <AICommandPanel />
        </div>
        {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      </div>
    </CanvasProvider>
  );
}
