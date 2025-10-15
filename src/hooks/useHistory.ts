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
    console.log('📝 Saving to history:', { shapeCount: currentShapes.length, selectedId });
    
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
        
        console.log('✅ History saved. New history length:', newHistory.length, 'New index:', prevIndex + 1);
        
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
    console.log('⏪ Undo called. Current index:', currentIndex, 'History length:', history.length);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const state = history[newIndex];
      console.log('⏪ Undoing to index:', newIndex, 'Shape count:', state.shapes.length);
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedId);
    } else {
      console.log('⏪ Cannot undo - already at oldest state');
    }
  }, [currentIndex, history, onRestore]);

  // Redo
  const redo = useCallback(() => {
    console.log('⏩ Redo called. Current index:', currentIndex, 'History length:', history.length);
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const state = history[newIndex];
      console.log('⏩ Redoing to index:', newIndex, 'Shape count:', state.shapes.length);
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedId);
    } else {
      console.log('⏩ Cannot redo - already at newest state');
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

