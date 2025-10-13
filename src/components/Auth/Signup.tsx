import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); 
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try { setBusy(true); await signup(email, password, displayName); nav("/"); }
    catch (e: any) { setErr(e.message); } 
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h2 className="text-xl font-bold">Create account</h2>
        <input className="w-full border p-2 rounded" placeholder="Display name (optional)" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={busy} className="w-full bg-black text-white rounded py-2">{busy ? "Creating…" : "Sign up"}</button>
      </form>
    </div>
  );
}
