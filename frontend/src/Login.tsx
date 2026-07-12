import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [badgeNo, setBadgeNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
      const res = await axios.post(`${apiUrl}/auth/login`, {
        badge_no: badgeNo,
        password: password
      });

      if (res.data.access_token) {
        localStorage.setItem("sam_token", res.data.access_token);
        localStorage.setItem("sam_officer", JSON.stringify(res.data.officer));
        
        // Setup axios default header for future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.access_token}`;
        
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background aesthetics */}
      <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-slate-900 to-black z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>
      
      <div className="glass-panel p-8 md:p-12 rounded-3xl w-full max-w-md z-10 shadow-2xl relative border border-white/10 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 mb-4 shadow-[0_0_30px_rgba(11,102,210,0.3)]">
                <span className="material-symbols-outlined text-primary text-3xl">local_police</span>
            </div>
            <h1 className="font-headline-lg text-white text-center">SAMRAKSHA</h1>
            <p className="font-label-caps text-text-secondary mt-2 tracking-widest text-xs">CENTRAL COMMAND</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-[18px]">error</span>
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
            )}
            
            <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-text-secondary uppercase">Badge ID</label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50 text-[20px]">badge</span>
                    <input 
                        type="text" 
                        value={badgeNo}
                        onChange={(e) => setBadgeNo(e.target.value)}
                        placeholder="e.g. 1001"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-body-md"
                        required
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-text-secondary uppercase">Access Cipher</label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50 text-[20px]">lock</span>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-body-md"
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="mt-4 w-full bg-primary text-white font-label-lg py-3.5 rounded-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50"
            >
                {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                ) : (
                    <>
                        Initialize Link
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                )}
            </button>
        </form>

        <p className="text-center text-text-secondary/40 text-xs mt-8">
            RESTRICTED ACCESS. UNAUTHORIZED ENTRY IS STRICTLY PROHIBITED.
        </p>
      </div>
    </div>
  );
}
