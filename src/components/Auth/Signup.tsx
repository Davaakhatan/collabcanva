import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../Layout/Navbar";

export default function Signup() {
  const { user, signup, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); 
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) nav("/");
  }, [user, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    
    if (password.length < 6) {
      setErr("Password must be at least 6 characters long.");
      return;
    }
    
    try { 
      setBusy(true); 
      await signup(email, password, displayName || undefined); 
      nav("/"); 
    }
    catch (e: any) { 
      setErr(e.message || "Failed to create account. Please try again.");
    } 
    finally { setBusy(false); }
  }

  async function handleGoogleLogin() {
    setErr(null);
    try {
      setBusy(true);
      await loginWithGoogle();
      nav("/");
    } catch (e: any) {
      setErr(e.message || "Failed to sign in with Google.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="min-h-[calc(100vh-3rem)] grid place-items-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
          <h2 className="text-2xl font-bold">Create your account</h2>
          <input 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
            placeholder="Display name (optional)" 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)} 
          />
          <input 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
            placeholder="Email" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <input 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
            placeholder="Password (min. 6 characters)" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {err && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{err}</p>}
          <button 
            disabled={busy} 
            className="w-full bg-black text-white rounded py-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Creating…" : "Sign up"}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={busy}
            className="w-full border rounded py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <p className="text-sm text-gray-600 text-center">
            Already have an account? <Link to="/login" className="underline text-black font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
