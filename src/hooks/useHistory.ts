import { useState, useCallback, useEffect, useRef } from 'react';
import type { Shape } from '../contexts/CanvasContext';

interface HistoryState {
  shapes: Shape[];
  selectedIds: string[];
}

const MAX_HISTORY = 50; // Maximum number of undo states

export function useHistory(
  currentShapes: Shape[],
  selectedIds: string[],
  onRestore: (shapes: Shape[], selectedIds: string[]) => void
) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isRestoringRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Initialize history with current state on first load
  useEffect(() => {
    if (!hasInitializedRef.current && currentShapes.length >= 0) {
      console.log('🚀 Initializing history with current state');
      const initialState: HistoryState = {
        shapes: JSON.parse(JSON.stringify(currentShapes)),
        selectedIds: [...selectedIds],
      };
      setHistory([initialState]);
      setCurrentIndex(0);
      hasInitializedRef.current = true;
    }
  }, [currentShapes, selectedIds]);

  // Save current state to history
  const pushState = useCallback(() => {
    // Don't save to history if we're currently restoring
    if (isRestoringRef.current) {
      console.log('🚫 Skipping history save - currently restoring');
      return;
    }
    
    console.log('📝 Saving to history:', { shapeCount: currentShapes.length, selectedIds });
    
    const newState: HistoryState = {
      shapes: JSON.parse(JSON.stringify(currentShapes)),
      selectedIds: [...selectedIds],
    };
    
    setHistory((prev) => {
      setCurrentIndex((prevIndex) => {
        // Remove any redo history if we're not at the end
        const newHistory = prev.slice(0, prevIndex + 1);
        
        // Add new state
        newHistory.push(newState);
        
        console.log('✅ History saved. New history length:', newHistory.length, 'New index:', prevIndex + 1);
        
        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
          return Math.min(prevIndex, MAX_HISTORY - 1);
        }
        
        return prevIndex + 1;
      });
      
      return prev.slice(0, currentIndex + 1).concat([newState]);
    });
  }, [currentShapes, selectedIds, currentIndex]);

  // Undo
  const undo = useCallback(() => {
    console.log('⏪ Undo called. Current index:', currentIndex, 'History length:', history.length);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const state = history[newIndex];
      console.log('⏪ Undoing to index:', newIndex, 'Shape count:', state.shapes.length);
      
      // Set restoration flag to prevent saving this as new history
      isRestoringRef.current = true;
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedIds);
      
      // Clear restoration flag after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
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
      
      // Set restoration flag to prevent saving this as new history
      isRestoringRef.current = true;
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedIds);
      
      // Clear restoration flag after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
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

