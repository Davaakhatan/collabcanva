import { usePresence } from "../../hooks/usePresence";

export default function PresenceList() {
  const { onlineUsers, onlineCount } = usePresence();

  if (onlineCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Online ({onlineCount})
        </h3>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-2">
        {onlineUsers.map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: user.color }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-700 truncate">{user.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

