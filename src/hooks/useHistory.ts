import { useState, useCallback, useEffect } from 'react';
import type { Shape } from '../contexts/CanvasContext';

interface HistoryState {
  shapes: Shape[];
  selectedId: string | null;
}

const MAX_HISTORY = 50; // Maximum number of undo states

export function useHistory(
  currentShapes: Shape[],
  selectedId: string | null,
  onRestore: (shapes: Shape[], selectedId: string | null) => void
) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Save current state to history
  const pushState = useCallback(() => {
    setHistory((prev) => {
      // Get current index from the updater function to avoid stale closure
      return prev;
    });
    
    setCurrentIndex((prevIndex) => {
      setHistory((prev) => {
        // Remove any redo history if we're not at the end
        const newHistory = prev.slice(0, prevIndex + 1);
        
        // Add new state
        const newState: HistoryState = {
          shapes: JSON.parse(JSON.stringify(currentShapes)),
          selectedId,
        };
        
        newHistory.push(newState);
        
        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
          return newHistory;
        }
        
        return newHistory;
      });
      
      return Math.min(prevIndex + 1, MAX_HISTORY - 1);
    });
  }, [currentShapes, selectedId]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const state = history[newIndex];
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedId);
    }
  }, [currentIndex, history, onRestore]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const state = history[newIndex];
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedId);
    }
  }, [currentIndex, history, onRestore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

