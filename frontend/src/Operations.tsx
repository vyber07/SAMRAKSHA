import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GenericModal } from "./Modal";
import axios from "axios";

export default function Operations() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const openModal = (title: string) => { setModalTitle(title); setIsModalOpen(true); };
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
    axios.get(`${apiUrl}/patrol/units`)
      .then(res => setData(res.data))
      .catch(() => {
        console.warn("Backend not running or auth required. Using mock data.");
        setData({units: 12, available: 4, responding: 3, deployed: 5});
      });
  }, []);

  return (
    <>
      <header className="sticky top-4 z-50 flex justify-between items-center px-gutter py-unit max-w-container-max mx-auto glass-header rounded-full mt-4 mx-4 md:mx-16 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
<div className="flex items-center gap-4">
<img alt="SAMRAKSHA Logo" className="h-10 w-10 object-contain rounded-full bg-white/10 p-1" src="https://lh3.googleusercontent.com/aida/AP1WRLvDDX_pEIsWgFFQNJE8uOZbf3Gh8rSJsWIW7ogglztw6jqqCxR4TKSYmMe1X89KddrPtVdEclk7DTevpPAqaOHu4l-a1imBU5SrGfbI-3mEARQ9-V862p4KcUC-LDKQYmhUBMEb7jqH2mIGHKFdW2Z9crlyqduTORLXUhegceNqftfhU6KkTdbQWZwVUZpYrsG8JOdgJ7Yd21TLvJkXlExsyJ_YpPUs25Y8-ThTHkhIdL6kfO3ezSe-220"/>
<span className="font-headline-xl text-headline-lg-mobile md:text-headline-xl font-bold text-white tracking-tight">SAMRAKSHA</span>
</div>
<div className="hidden md:flex items-center bg-white/5 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 focus-within:border-primary focus-within:bg-white/10 transition-all duration-300 w-96">
<span className="material-symbols-outlined text-text-secondary mr-2">search</span>
<input className="bg-transparent border-none outline-none focus:ring-0 w-full text-white font-body-md placeholder-text-secondary" placeholder="Search commands, alerts..." type="text"/>
</div>
<div className="flex items-center gap-2">
<button className="p-2 rounded-full hover:bg-white/10 hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-text-secondary hover:text-white active:scale-95">
<span className="material-symbols-outlined">notifications</span>
</button>
<button className="p-2 rounded-full hover:bg-white/10 hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-text-secondary hover:text-white active:scale-95 hidden sm:block">
<span className="material-symbols-outlined">settings</span>
</button>
<div className="h-10 w-10 rounded-full border border-white/20 overflow-hidden ml-2 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300">
<img className="h-full w-full object-cover" data-alt="A futuristic, high-resolution 3D render avatar of a tech-savvy professional looking slightly to the side, set against a soft, luminous light-blue background. The lighting is high-key studio style, emphasizing a clean, modern, and premium aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-qTHZ9eT46tpEtcZRbUhgx3eH--lBMiN2CVkqyRcm10TxTOCrQnqClLUNqo596fqEqQ6OyLQ6l_RuY8JjcSWwpD5Ey2iI6N8FHYfNWZ1cHd41AdDgnhrEvC_lLNOcU7vjw6_cuocJidATm38TKu0K9a-SgUtdVAFfJj3NdmnuXhBk1KaYAu5hOJfuP2JoekyHDLUrPPJTZSgwlqvm3SO5w_g_x8M7e48P8piNtbmfPkhXip-OG7wMt55UThbQdDSzGAmEunGRpVY"/>
</div>
</div>
</header>
      <div className="max-w-container-max mx-auto px-4 md:px-16 mt-8 flex flex-col lg:flex-row gap-6 pb-20">
        <nav className="hidden lg:flex flex-col w-64 shrink-0 glass-panel p-4 self-start sticky top-28 h-[calc(100vh-160px)]">
<div className="mb-8 px-4">
<h2 className="font-headline-lg text-headline-lg text-white">Command Center</h2>
<p className="font-label-md text-label-md text-text-secondary mt-1">Active Monitoring</p>
</div>
<ul className="flex flex-col gap-2 flex-grow">
<li>
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/">
<span className="material-symbols-outlined">dashboard</span> Overview</Link>
</li>
<li>
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/cases">
<span className="material-symbols-outlined">analytics</span> Cases</Link>
</li>
<li>
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/analytics">
<span className="material-symbols-outlined">monitoring</span> Analytics</Link>
</li>
<li>
<Link className="bg-primary/20 text-white font-label-lg text-label-lg rounded-full p-4 flex items-center gap-4 transition-all duration-300 translate-x-1 shadow-sm border border-primary/30" to="/operations">
<span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span> Operations</Link>
</li>
<li>
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/resources">
<span className="material-symbols-outlined">inventory_2</span> Resources</Link>
</li>
<li>
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/security">
<span className="material-symbols-outlined">shield</span> Security</Link>
</li>
<li>
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/intelligence">
<span className="material-symbols-outlined">psychology</span> Intelligence</Link>
</li>
<li>
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/archive">
<span className="material-symbols-outlined">archive</span> Archive</Link>
</li>
</ul>
<button onClick={() => openModal('Deploy New Mission')} className="mt-auto w-full bg-primary text-white font-label-lg text-label-lg py-3 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] hover:brightness-110 active:scale-95 transition-all duration-300 flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-[20px]">add</span> New Mission
</button>
</nav>
        
        <main className="flex-1 flex flex-col gap-6 md:h-[calc(100vh-160px)] min-h-[800px] md:min-h-[800px] xl:min-h-[600px]">
            <div className="glass-panel p-6 border-b border-white/10">
                <h2 className="font-headline-lg-mobile text-white">Active Operations & Patrol Dispatch</h2>
                <p className="text-sm text-text-secondary mt-1 font-body-md">Manage field units and active missions</p>
            </div>
            
            <section className="flex-1 glass-panel p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data && Object.keys(data).length > 0 ? (
                        Object.entries(data).map(([key, val], i) => (
                            <div key={i} className="bg-black/40 border border-white/10 p-5 rounded-xl">
                                <h3 className="font-label-caps text-text-secondary mb-2 uppercase">{key.replace(/_/g, " ")}</h3>
                                <p className="text-white font-medium">{typeof val === "object" ? JSON.stringify(val).substring(0, 50) + "..." : String(val)}</p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-text-secondary py-10">No data available from /patrol/units</div>
                    )}
                </div>
            </section>
        </main>
      </div>
      <GenericModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
    <p>This module requires Central Command authentication token to proceed. Action logged.</p>
  </GenericModal>
</>
  );
}
