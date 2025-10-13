import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";

function Home() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Home</h1>
      <p>Routing sanity check.</p>
      <div className="flex gap-3">
        <Link to="/login" className="underline text-blue-600">Go to Login</Link>
        <Link to="/signup" className="underline text-blue-600">Go to Signup</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </AuthProvider>
  );
}
