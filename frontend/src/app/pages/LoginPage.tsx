import React, { useState } from "react";
import { Shield, Sun, Moon, EyeOff, Eye, AlertCircle } from "lucide-react";
import { useApp } from "../App";

function LoginPage() {
  const { login, themeMode, toggleTheme } = useApp();
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!badge || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try { await login(badge, password); }
    catch (e: unknown) { setError((e as Error).message || "Login failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen text-[var(--foreground)] flex items-center justify-center p-6 relative transition-colors duration-300">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          title={themeMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:scale-105 active:scale-95"
        >
          {themeMode === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-blue-600" />}
          <span className="text-xs font-semibold">
            {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>

      <div className="glass-container sm:p-8 w-full max-w-md p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.svg" alt="SAMRAKSHA Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-montserrat text-xl font-bold text-[#004B87] dark:text-[#A8CAFF] tracking-wide">SAMRAKSHA</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Ahmedabad City Police Command</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm font-semibold text-[var(--foreground)]">
            Badge number
            <input
              required
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 outline-none focus:border-[#004B87] dark:focus:border-[#A8CAFF] text-sm text-[var(--foreground)] transition-colors"
              placeholder="e.g., ADMIN001"
            />
          </label>

          <label className="block text-sm font-semibold text-[var(--foreground)]">
            Password
            <div className="relative mt-2">
              <input
                required
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 outline-none focus:border-[#004B87] dark:focus:border-[#A8CAFF] pr-10 text-sm text-[var(--foreground)] transition-colors"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 cursor-pointer"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="px-3 py-2 rounded-lg text-xs flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="inline-flex items-center justify-center font-montserrat font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121212] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] btn-primary bg-[#004B87] text-white hover:bg-[#003966] active:bg-[#002B4D] dark:bg-[#A8CAFF] dark:text-[#001D36] dark:hover:bg-[#C2DCFF] shadow-md shadow-[#004B87]/20 dark:shadow-none focus-visible:ring-[#004B87] dark:focus-visible:ring-[#A8CAFF] relative overflow-hidden h-11 px-4 text-sm rounded-xl gap-2 w-full cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <span>Sign in to command center</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
