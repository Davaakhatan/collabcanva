import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div className="h-12 border-b px-4 flex items-center justify-between">
      <span className="font-semibold">CollabCanvas</span>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{user.displayName || user.email}</span>
          <button onClick={logout} className="text-sm border rounded px-2 py-1">Logout</button>
        </div>
      )}
    </div>
  );
}
