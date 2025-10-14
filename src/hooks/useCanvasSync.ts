import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Shape } from "../contexts/CanvasContext";
import {
  subscribeToCanvas,
  createShape as createShapeService,
  updateShape as updateShapeService,
  deleteShape as deleteShapeService,
  lockShape as lockShapeService,
  unlockShape as unlockShapeService,
  initializeCanvas,
} from "../services/canvas";
import { debounce } from "../utils/helpers";

export function useCanvasSync() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track lock timeouts
  const lockTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('useCanvasSync: Initializing...');
    setLoading(true);
    
    // Initialize canvas first
    initializeCanvas()
      .then(() => {
        console.log('Canvas initialized successfully');
        // Then subscribe
        const unsubscribe = subscribeToCanvas((updatedShapes) => {
          console.log('Received shapes update:', updatedShapes.length, 'shapes');
          setShapes(updatedShapes);
          setLoading(false);
        });
        
        return () => {
          console.log('Unsubscribing from canvas');
          unsubscribe();
          // Clear all lock timeouts
          lockTimeoutsRef.current.forEach(clearTimeout);
        };
      })
      .catch((err) => {
        console.error("Failed to initialize canvas:", err);
        alert('Failed to connect to Firebase: ' + err.message);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Add shape
  const addShape = useCallback(
    async (shape: Shape) => {
      console.log('useCanvasSync.addShape called', { 
        shape, 
        user, 
        hasUser: !!user,
        userId: (user as any)?.uid,
        userEmail: (user as any)?.email,
        userKeys: user ? Object.keys(user) : []
      });
      
      if (!user) {
        console.error('Cannot add shape: user is null/undefined');
        alert('You must be logged in to add shapes. Please refresh the page.');
        return;
      }
      
      const userId = (user as any).uid;
      if (!userId) {
        console.error('Cannot add shape: user.uid not found', { user });
        alert('Authentication error: User ID not found. Please log out and log back in.');
        return;
      }

      try {
        const shapeWithUser = {
          ...shape,
          createdBy: userId,
          createdAt: Date.now(),
        };
        
        console.log('Creating shape in Firestore:', shapeWithUser);
        await createShapeService(shapeWithUser);
        console.log('Shape created successfully');
      } catch (err: any) {
        console.error("Failed to create shape:", err);
        alert('Failed to create shape: ' + err.message);
        setError(err.message);
      }
    },
    [user]
  );

  // Update shape (debounced for performance)
  const updateShape = useCallback(
    debounce(async (shapeId: string, updates: Partial<Shape>) => {
      const userId = (user as any)?.uid;
      if (!userId) return;

      try {
        const shapeToUpdate = shapes.find(s => s.id === shapeId);
        
        // Check if shape is locked by another user
        if (shapeToUpdate?.isLocked && shapeToUpdate.lockedBy !== userId) {
          console.warn("Cannot update shape locked by another user");
          return;
        }

        await updateShapeService(shapeId, {
          ...updates,
          lastModifiedBy: userId,
        });
      } catch (err: any) {
        console.error("Failed to update shape:", err);
        setError(err.message);
      }
    }, 100),
    [user, shapes]
  );

  // Delete shape
  const deleteShape = useCallback(
    async (shapeId: string) => {
      const userId = (user as any)?.uid;
      if (!userId) return;

      try {
        const shapeToDelete = shapes.find(s => s.id === shapeId);
        
        // Check if shape is locked by another user
        if (shapeToDelete?.isLocked && shapeToDelete.lockedBy !== userId) {
          console.warn("Cannot delete shape locked by another user");
          return;
        }

        await deleteShapeService(shapeId);
      } catch (err: any) {
        console.error("Failed to delete shape:", err);
        setError(err.message);
      }
    },
    [user, shapes]
  );

  // Lock shape
  const lockShape = useCallback(
    async (shapeId: string) => {
      const userId = (user as any)?.uid;
      if (!userId) return false;

      try {
        const shape = shapes.find(s => s.id === shapeId);
        
        // Check if shape is locked
        if (shape?.isLocked && shape.lockedBy !== userId) {
          // Check if the lock is stale (older than 10 seconds)
          const now = Date.now();
          const lockAge = now - (shape.lockedAt || now);
          
          if (lockAge > 10000) {
            // Lock is stale - force unlock and proceed
            console.log(`Breaking stale lock on shape ${shapeId} (${lockAge}ms old)`);
            await unlockShapeService(shapeId);
          } else {
            // Lock is fresh - another user is actively editing
            return false;
          }
        }

        await lockShapeService(shapeId, userId);
        
        // Auto-unlock after 5 seconds as safety fallback
        // (Normal unlock happens immediately when drag/transform ends)
        const timeout = window.setTimeout(() => {
          unlockShape(shapeId);
          lockTimeoutsRef.current.delete(shapeId);
        }, 5000);
        
        lockTimeoutsRef.current.set(shapeId, timeout);
        return true;
      } catch (err: any) {
        console.error("Failed to lock shape:", err);
        return false;
      }
    },
    [user, shapes]
  );

  // Unlock shape
  const unlockShape = useCallback(
    async (shapeId: string) => {
      const userId = (user as any)?.uid;
      if (!userId) return;

      try {
        // Clear timeout if exists
        const timeout = lockTimeoutsRef.current.get(shapeId);
        if (timeout) {
          clearTimeout(timeout);
          lockTimeoutsRef.current.delete(shapeId);
        }

        const shape = shapes.find(s => s.id === shapeId);
        
        // Only unlock if we own the lock
        if (shape?.lockedBy === userId) {
          await unlockShapeService(shapeId);
        }
      } catch (err: any) {
        console.error("Failed to unlock shape:", err);
      }
    },
    [user, shapes]
  );

  return {
    shapes,
    loading,
    error,
    addShape,
    updateShape,
    deleteShape,
    lockShape,
    unlockShape,
  };
}

