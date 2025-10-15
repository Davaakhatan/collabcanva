import { useState, useRef, useEffect, useCallback } from "react";
import { usePresence } from "../../hooks/usePresence";
import type { CursorsMap } from "../../services/cursor";

interface PresenceListProps {
  cursors: CursorsMap;
  onUserClick: (userId: string, cursorX: number, cursorY: number) => void;
}

export default function PresenceList({ cursors, onUserClick }: PresenceListProps) {
  const { onlineUsers, onlineCount } = usePresence();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => ({ 
    x: 24, 
    y: Math.max(100, window.innerHeight - 300) 
  }));
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  if (onlineCount === 0) {
    return null;
  }

  const handleUserClick = (userId: string) => {
    const cursor = cursors[userId];
    if (cursor) {
      console.log(`Jumping to user ${userId} at cursor position:`, cursor.cursorX, cursor.cursorY);
      onUserClick(userId, cursor.cursorX, cursor.cursorY);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button:not(.drag-handle)')) {
      return; // Don't drag when clicking other buttons
    }
    
    setIsDragging(true);
    setPosition((currentPos) => {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: currentPos.x,
        initialY: currentPos.y,
      };
      return currentPos;
    });
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 300, dragRef.current.initialX + deltaX)),
        y: Math.max(72, Math.min(window.innerHeight - 100, dragRef.current.initialY + deltaY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="fixed bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-600/50 z-50 max-w-xs overflow-hidden transition-shadow duration-300"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors drag-handle">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Online
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{onlineCount} {onlineCount === 1 ? 'person' : 'people'}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 hover:bg-gray-200/50 dark:hover:bg-slate-600/50 rounded"
        >
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* User List */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 max-h-80 overflow-y-auto">
          {onlineUsers.map((user) => {
            const hasCursor = cursors[user.userId];
            return (
              <button
                key={user.userId}
                onClick={() => handleUserClick(user.userId)}
                disabled={!hasCursor}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-slate-700"
                title={hasCursor ? `Jump to ${user.displayName}'s cursor` : `${user.displayName} (no cursor yet)`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: user.color }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {user.displayName}
                  </p>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {hasCursor ? 'Click to follow' : 'Active now'}
                    </span>
                  </div>
                </div>
                {hasCursor && (
                  <svg 
                    className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

