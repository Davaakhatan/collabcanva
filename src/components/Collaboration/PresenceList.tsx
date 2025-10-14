import { useState } from "react";
import { usePresence } from "../../hooks/usePresence";
import type { CursorsMap } from "../../services/cursor";

interface PresenceListProps {
  cursors: CursorsMap;
  onUserClick: (userId: string, cursorX: number, cursorY: number) => void;
}

export default function PresenceList({ cursors, onUserClick }: PresenceListProps) {
  const { onlineUsers, onlineCount } = usePresence();
  const [isExpanded, setIsExpanded] = useState(true);

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

  return (
    <div className="fixed top-20 right-6 bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 z-40 max-w-xs overflow-hidden transition-all duration-300">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">
              Online
            </h3>
            <p className="text-xs text-gray-500">{onlineCount} {onlineCount === 1 ? 'person' : 'people'}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

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
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
                title={hasCursor ? `Jump to ${user.displayName}'s cursor` : `${user.displayName} (no cursor yet)`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: user.color }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.displayName}
                  </p>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-xs text-gray-500">
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

