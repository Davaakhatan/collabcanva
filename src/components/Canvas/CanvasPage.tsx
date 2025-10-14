import Navbar from "../Layout/Navbar";
import Canvas from "./Canvas";
import CanvasControls from "./CanvasControls";
import { CanvasProvider } from "../../contexts/CanvasContext";

export default function CanvasPage() {
  return (
    <CanvasProvider>
      <div className="relative w-full h-screen overflow-hidden">
        <Navbar />
        <Canvas />
        <CanvasControls />
      </div>
    </CanvasProvider>
  );
}

