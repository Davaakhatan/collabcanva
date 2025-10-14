import { Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import CanvasPage from "./components/Canvas/CanvasPage";
import Navbar from "./components/Layout/Navbar";

function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Welcome to CollabCanvas</h1>
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✅ Logged in as <strong>{user.displayName || user.email}</strong>
              </p>
              <p className="text-sm text-green-600 mt-1">Email: {user.email}</p>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ready to Create?</h2>
              <p className="text-gray-600">
                Start collaborating on the canvas with your team in real-time.
              </p>
              <div className="flex gap-3">
                <Link 
                  to="/canvas" 
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
                >
                  Open Canvas →
                </Link>
                <button 
                  onClick={logout}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              A real-time collaborative canvas for teams to draw and brainstorm together.
            </p>
            <div className="flex gap-3">
              <Link 
                to="/login" 
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 border border-black rounded hover:bg-gray-50"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route 
        path="/canvas" 
        element={
          <ProtectedRoute>
            <CanvasPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
