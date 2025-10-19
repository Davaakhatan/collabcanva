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
    if (!hasInitializedRef.current) {
      const initialState: HistoryState = {
        shapes: JSON.parse(JSON.stringify(currentShapes)),
        selectedIds: [...selectedIds],
      };
      
      setHistory([initialState]);
      setCurrentIndex(0);
      hasInitializedRef.current = true;
      console.log('🚀 [useHistory] Initialized with:', { 
        shapeCount: initialState.shapes.length, 
        selectedIdsCount: initialState.selectedIds.length 
      });
    }
  }, [currentShapes, selectedIds]); // Add dependencies to ensure proper initialization

  // Removed problematic useEffect hooks that were causing re-initialization

  // Removed problematic useEffect that was causing infinite re-renders

  // Removed state change detection to ensure all actions are captured

  // Save current state to history
  const pushState = useCallback(() => {
    console.log('💾 [useHistory] pushState called', { 
      isRestoring: isRestoringRef.current,
      shapeCount: currentShapes.length,
      selectedIdsCount: selectedIds.length,
      currentIndex,
      historyLength: history.length
    });
    
    // Don't save to history if we're currently restoring
    if (isRestoringRef.current) {
      console.log('🚫 [useHistory] Skipping save - currently restoring');
      return;
    }
    
    // Validate current state before saving
    if (!currentShapes || !Array.isArray(currentShapes) || 
        !selectedIds || !Array.isArray(selectedIds)) {
      console.log('❌ [useHistory] Invalid state - cannot save');
      return;
    }
    
    // Create a deep copy of the current state
    const newState: HistoryState = {
      shapes: JSON.parse(JSON.stringify(currentShapes)),
      selectedIds: [...selectedIds],
    };
    
    console.log('✅ [useHistory] Saving state to history', { 
      newStateShapeCount: newState.shapes.length,
      newStateSelectedIdsCount: newState.selectedIds.length
    });
    
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      
      setCurrentIndex(newHistory.length - 1);
      
      console.log('📝 [useHistory] History updated', { 
        newLength: newHistory.length, 
        newIndex: newHistory.length - 1,
        previousLength: prev.length
      });
      
      return newHistory;
    });
  }, [currentShapes, selectedIds, currentIndex, history.length]);

  // Force save current state (useful for ensuring final state is captured)
  const forceSave = useCallback(() => {
    console.log('💾 [useHistory] Force save called');
    pushState();
  }, [pushState]);

  // No cleanup needed since we removed debouncing

  // Disable auto-save to prevent too many history entries
  // We'll use manual saving for specific actions only

  // Undo
  const undo = useCallback(() => {
    console.log('↩️ [useHistory] Undo called', { 
      currentIndex, 
      historyLength: history.length,
      canUndo: currentIndex > 0 && history.length > 0
    });
    
    if (currentIndex > 0 && history.length > 0) {
      const newIndex = currentIndex - 1;
      const state = history[newIndex];
      
      console.log('↩️ [useHistory] Undo to index', { 
        newIndex, 
        stateExists: !!state,
        stateShapes: state?.shapes?.length,
        stateSelectedIds: state?.selectedIds?.length
      });
      
      // Check if state exists and has required properties
      if (!state || !state.shapes || !state.selectedIds) {
        console.log('❌ [useHistory] Undo failed - invalid state');
        return;
      }
      
      // Set restoration flag to prevent saving this as new history
      isRestoringRef.current = true;
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedIds);
      
      console.log('✅ [useHistory] Undo completed', { newIndex });
      
      // Clear restoration flag after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    } else {
      console.log('❌ [useHistory] Cannot undo - no history or at beginning');
    }
  }, [currentIndex, history, onRestore]);

  // Redo
  const redo = useCallback(() => {
    console.log('↪️ [useHistory] Redo called', { 
      currentIndex, 
      historyLength: history.length,
      canRedo: currentIndex < history.length - 1 && history.length > 0
    });
    
    if (currentIndex < history.length - 1 && history.length > 0) {
      const newIndex = currentIndex + 1;
      const state = history[newIndex];
      
      console.log('↪️ [useHistory] Redo to index', { 
        newIndex, 
        stateExists: !!state,
        stateShapes: state?.shapes?.length,
        stateSelectedIds: state?.selectedIds?.length
      });
      
      // Check if state exists and has required properties
      if (!state || !state.shapes || !state.selectedIds) {
        console.log('❌ [useHistory] Redo failed - invalid state');
        return;
      }
      
      // Set restoration flag to prevent saving this as new history
      isRestoringRef.current = true;
      setCurrentIndex(newIndex);
      onRestore(state.shapes, state.selectedIds);
      
      console.log('✅ [useHistory] Redo completed', { newIndex });
      
      // Clear restoration flag after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    } else {
      console.log('❌ [useHistory] Cannot redo - no history or at end');
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

  const canUndo = Boolean(currentIndex > 0 && history.length > 0 && 
                  history[currentIndex - 1] && 
                  history[currentIndex - 1].shapes && 
                  history[currentIndex - 1].selectedIds);
  const canRedo = Boolean(currentIndex < history.length - 1 && history.length > 0 && 
                  history[currentIndex + 1] && 
                  history[currentIndex + 1].shapes && 
                  history[currentIndex + 1].selectedIds);

  // Debug logging to understand why buttons are inactive (reduced frequency)
  if (currentShapes.length > 0 || history.length > 1) {
    console.log('🔍 [useHistory] State:', {
      currentIndex,
      historyLength: history.length,
      canUndo,
      canRedo,
      currentShapesCount: currentShapes.length
    });
  }

  return {
    pushState,
    forceSave,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

