import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { GenericModal } from "./Modal";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});



export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const openModal = (title: string) => { setModalTitle(title); setIsModalOpen(true); };
  const [incidents, setIncidents] = useState<any[]>([]);
  
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
    axios.get(`${apiUrl}/incident/`)
      .then(res => {
        if (res.data && res.data.incidents) setIncidents(res.data.incidents);
      })
      .catch(() => {
        console.warn("Backend not running or incident fetch failed. Using mock data.");
        setIncidents([
          { id: 'INC-2041', crime_type: 'Assault in Progress', severity: 4, status: 'active', time_str: '2m ago' },
          { id: 'INC-2040', crime_type: 'Suspicious Loitering', severity: 2, status: 'active', time_str: '15m ago' },
          { id: 'INC-2039', crime_type: 'Traffic Collision', severity: 3, status: 'active', time_str: '45m ago' }
        ]);
      });
  }, []);

  return (
    <>
      {/* SVG Icons and UI */}
      {/*  TopNavBar  */}
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
{/*  SideNavBar  */}
<nav className="hidden lg:flex flex-col w-64 shrink-0 glass-panel p-4 self-start sticky top-28 h-[calc(100vh-160px)]">
<div className="mb-8 px-4">
<h2 className="font-headline-lg text-headline-lg text-white">Command Center</h2>
<p className="font-label-md text-label-md text-text-secondary mt-1">Active Monitoring</p>
</div>
<ul className="flex flex-col gap-2 flex-grow">
<li>
<Link className="bg-primary/20 text-white font-label-lg text-label-lg rounded-full p-4 flex items-center gap-4 transition-all duration-300 translate-x-1 shadow-sm border border-primary/30" to="/">
<span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span> Overview</Link>
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
<Link className="text-text-secondary font-label-lg text-label-lg flex items-center gap-4 p-4 hover:bg-white/5 hover:text-white rounded-full transition-colors hover:backdrop-blur-xl" to="/operations">
<span className="material-symbols-outlined">precision_manufacturing</span> Operations</Link>
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
{/*  Main Content Canvas  */}
<main className="flex-1 flex flex-col gap-6">
{/*  Live Operations Key Metrics (Bento Grid Style)  */}
<section className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/*  Metric 1  */}
<div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-default">
<div className="flex justify-between items-start mb-4">
<div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
</div>
<span className="font-label-md text-label-md text-red-400 bg-red-500/10 px-3 py-1 rounded-full flex items-center gap-1 border border-red-500/20">
<span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
                        </span>
</div>
<div>
<h3 className="font-headline-xl text-headline-xl font-bold text-white tracking-tight">{incidents.length || 142}</h3>
<p className="font-body-md text-body-md text-text-secondary mt-1">Incidents Today</p>
</div>
</div>
{/*  Metric 2  */}
<div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-default">
<div className="flex justify-between items-start mb-4">
<div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
</div>
<span className="font-label-md text-label-md text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
<span className="material-symbols-outlined text-[14px]">trending_down</span> -2m
                        </span>
</div>
<div>
<h3 className="font-headline-xl text-headline-xl font-bold text-white tracking-tight">12m</h3>
<p className="font-body-md text-body-md text-text-secondary mt-1">Avg Response</p>
</div>
</div>
{/*  Metric 3  */}
<div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-default">
<div className="flex justify-between items-start mb-4">
<div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
</div>
<span className="font-label-md text-label-md text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full border border-slate-600/50">
                            Active
                        </span>
</div>
<div>
<h3 className="font-headline-xl text-headline-xl font-bold text-white tracking-tight">{incidents.filter(i => i.status !== "Resolved").length || 45}</h3>
<p className="font-body-md text-body-md text-text-secondary mt-1">Active Patrols</p>
</div>
</div>
</section>
<div className="flex flex-col xl:flex-row gap-6 min-h-[800px] xl:min-h-[600px] xl:h-[600px]">
{/*  Patrol Map Section  */}
<section className="glass-panel flex-1 overflow-hidden relative flex flex-col p-2 min-h-[400px] xl:min-h-[600px]">
<div className="px-6 py-4 flex justify-between items-center z-10 absolute top-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10">
<h3 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-white">Patrol Map</h3>
<div className="flex gap-2">
<button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-colors">
<span className="material-symbols-outlined text-[20px]">filter_list</span>
</button>
<button className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-colors">
<span className="material-symbols-outlined text-[20px]">my_location</span>
</button>
</div>
</div>
{/*  Faux Map Background  */}
<div className="absolute inset-0 w-full h-full rounded-[22px] overflow-hidden">
<MapContainer center={[23.0225, 72.5714]} zoom={11} style={{ height: "100%", minHeight: "400px", width: "100%", zIndex: 0 }}>
  <TileLayer
    attribution="&copy; OpenStreetMap contributors"
    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  />
  {incidents.map((inc, i) => (
    inc.lat && inc.lon && (
      <Marker key={`marker-${i}`} position={[inc.lat, inc.lon]}>
        <Popup>
          <div className="text-slate-900">
            <strong>{inc.id}</strong><br/>
            {inc.crime_type}<br/>
            Priority: {inc.severity}
          </div>
        </Popup>
      </Marker>
    )
  ))}
</MapContainer>
</div>
</section>
{/*  Recent Alerts Sidebar  */}
<aside className="glass-panel w-full xl:w-96 flex flex-col p-6 overflow-hidden">
<div className="flex justify-between items-center mb-6">
<h3 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-white">Recent Alerts</h3>
<button className="text-primary font-label-md text-label-md hover:underline">View All</button>
</div>
<div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
{incidents.map((inc, i) => (
<div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/10 transition-colors duration-300 cursor-pointer">
<div className="flex justify-between items-start">
<div className="flex items-center gap-3">
<div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${inc.severity >= 4 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
</div>
<div>
<h4 className="font-label-lg text-label-lg text-white font-semibold">{inc.crime_type}</h4>
<p className="font-body-md text-body-md text-text-secondary text-sm">{inc.id} • {inc.time_str || "Just now"}</p>
</div>
</div>
<span className={`font-label-md text-label-md px-3 py-1 rounded-full border whitespace-nowrap ${inc.severity >= 4 ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" : "bg-slate-700/50 text-slate-300 border-slate-600/50"}`}>
                                    {inc.status || "Pending"}
                                </span>
</div>
<p className="font-body-md text-body-md text-slate-300 text-sm border-t border-white/10 pt-2 mt-1">
                                Priority {inc.severity}
                            </p>
</div>
))}
{incidents.length === 0 && <div className="text-center text-text-secondary py-10">No active incidents.</div>}
</div>
</aside>
</div>
</main>
</div>
      <GenericModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
    <p>This module requires Central Command authentication token to proceed. Action logged.</p>
  </GenericModal>
</>
  );
}
