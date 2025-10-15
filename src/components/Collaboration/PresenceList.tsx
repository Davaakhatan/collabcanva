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
    <div 
      className="fixed left-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 dark:border-slate-600/50 z-30 max-w-[200px] overflow-hidden transition-all duration-300"
      style={{
        bottom: 'max(env(safe-area-inset-bottom, 0px), 24px)'
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              Online
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{onlineCount} {onlineCount === 1 ? 'person' : 'people'}</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* User List */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-1 max-h-64 overflow-y-auto">
          {onlineUsers.map((user) => {
            const hasCursor = cursors[user.userId];
            return (
              <button
                key={user.userId}
                onClick={() => handleUserClick(user.userId)}
                disabled={!hasCursor}
                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-slate-700"
                title={hasCursor ? `Jump to ${user.displayName}'s cursor` : `${user.displayName} (no cursor yet)`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform shrink-0"
                  style={{ backgroundColor: user.color }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {user.displayName}
                  </p>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {hasCursor ? 'Follow' : 'Active'}
                    </span>
                  </div>
                </div>
                {hasCursor && (
                  <svg 
                    className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
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

