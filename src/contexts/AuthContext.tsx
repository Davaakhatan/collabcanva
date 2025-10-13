import { createContext, useContext, useState } from "react";

type Ctx = {
  user: { displayName?: string; email?: string } | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string)=>Promise<void>;
  login: (email: string, password: string)=>Promise<void>;
  loginWithGoogle: ()=>Promise<void>;
  logout: ()=>Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Ctx["user"]>(null);

  const signup = async (_e: string, _p: string, dn?: string) => setUser({ displayName: dn || "User" });
  const login  = async (_e: string, _p: string) => setUser({ email: "user@example.com" });
  const loginWithGoogle = async () => setUser({ displayName: "Google User" });
  const logout = async () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading:false, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
