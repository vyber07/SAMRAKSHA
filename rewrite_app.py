import re

with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Find the start of the return statement in the App component
match = re.search(r'  return \(\n    <div className="min-h-screen', content)
if not match:
    match = re.search(r'  return \(\n    <div', content)

if match:
    logic_part = content[:match.start()]
else:
    print("Could not find return statement")
    exit(1)

new_render = """  return (
    <div className="min-h-screen text-on-surface antialiased flex flex-col pb-20">
      {renderNavBar()}

      <div className="max-w-container-max mx-auto px-4 md:px-16 mt-8 flex flex-col gap-6 w-full flex-1">
        
        {dbStatus === 'offline' && (
          <div className="glass-panel p-4 border border-red-500/50 bg-red-500/10 text-red-400 rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined">wifi_off</span>
            <span>Database connection lost. Enforced Read-Only Cache Mode.</span>
          </div>
        )}

        {currentPath === '/dashboard' && (
          <div className="flex flex-col gap-6">
            <h2 className="font-headline-lg text-headline-lg text-white">Command Center Overview</h2>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 cursor-pointer" onClick={() => navigate('/case-detail')}>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
                  </div>
                  <span className="font-label-md text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">Critical</span>
                </div>
                <div>
                  <h3 className="font-headline-xl text-white tracking-tight">24</h3>
                  <p className="font-body-md text-text-secondary mt-1">Active Cases</p>
                </div>
              </div>

              <div className="glass-panel p-6 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 cursor-pointer" onClick={() => navigate('/fir')}>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: "'FILL' 1"}}>note_add</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-xl text-white tracking-tight">3</h3>
                  <p className="font-body-md text-text-secondary mt-1">New FIRs Today</p>
                </div>
              </div>

              <div className="glass-panel p-6 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 cursor-pointer" onClick={() => navigate('/map')}>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: "'FILL' 1"}}>local_police</span>
                  </div>
                  <span className="font-label-md text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{patrolStatus}</span>
                </div>
                <div>
                  <h3 className="font-headline-xl text-white tracking-tight">12</h3>
                  <p className="font-body-md text-text-secondary mt-1">Units Deployed</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {currentPath === '/map' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center glass-panel p-4">
              <h2 className="font-headline-lg text-white">Patrol Map</h2>
              <div className="flex gap-4">
                <input type="text" placeholder="Search areas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-dark text-on-surface rounded-full px-4 py-2" />
                <button className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-full hover:bg-primary/30 transition-colors" onClick={handleSearchLocation}>Search</button>
                <button className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 transition-colors" onClick={() => setIsOnline(!isOnline)}>
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
              </div>
            </div>
            
            <div className="glass-panel overflow-hidden relative" style={{ height: '600px' }}>
              <MapContainer center={[23.0225, 72.5714]} zoom={11} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="map-tiles"
                />
                {hotspots
                  .filter((h) => filter === 'All' || h.risk === filter)
                  .map((h) => (
                    <Marker key={h.id} position={[h.lat, h.lon]} eventHandlers={{ click: () => setSelectedHotspot(h) }}>
                      <Popup>
                        <div className="text-black">
                          <strong>{h.title}</strong><br />
                          Risk: {h.risk}<br />
                          <button className="bg-primary text-white px-2 py-1 rounded mt-2 text-sm" onClick={() => {
                            setLatitude(h.lat.toString());
                            setLongitude(h.lon.toString());
                            navigate('/fir');
                          }}>Create FIR Here</button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {patrolRoute && <Polyline positions={hotspots.map(h => [h.lat, h.lon] as [number, number])} color="#0B66D2" weight={4} />}
              </MapContainer>
            </div>
          </div>
        )}

        {currentPath === '/fir' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <h2 className="font-headline-lg text-white mb-2">Register FIR</h2>
            <div className="glass-surface rounded-24px p-8">
              {firSuccess && <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{firSuccess}</div>}
              {firError && <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{firError}</div>}
              
              <form onSubmit={handleFIRSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-on-surface-variant">Complainant Name</label>
                  <input type="text" className="input-dark rounded-lg p-3 text-white" value={complainant} onChange={(e) => setComplainant(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-on-surface-variant">Incident Description</label>
                  <textarea className="input-dark rounded-lg p-3 text-white h-32 resize-none" value={description} onChange={handleDescriptionChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-on-surface-variant">Latitude</label>
                    <input type="text" className="input-dark rounded-lg p-3 text-white" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-on-surface-variant">Longitude</label>
                    <input type="text" className="input-dark rounded-lg p-3 text-white" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-on-surface-variant">Incident Time</label>
                    <input type="datetime-local" className="input-dark rounded-lg p-3 text-white" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-on-surface-variant">Police Station</label>
                    <input type="text" className="input-dark rounded-lg p-3 text-white" value={policeStation} onChange={(e) => setPoliceStation(e.target.value)} required />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-on-surface-variant">Suggested BNS Section</label>
                  <input type="text" className="input-dark rounded-lg p-3 text-primary bg-primary/5" value={suggestedSection} readOnly />
                </div>
                <button type="submit" className="mt-4 bg-primary-container text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-container/90 transition-colors border border-primary-container/50" disabled={firLoading || dbStatus === 'offline'}>
                  {firLoading ? 'Submitting FIR...' : 'Submit FIR Record'}
                </button>
              </form>
            </div>
          </div>
        )}

        {currentPath === '/case-detail' && (
          <div className="flex flex-col gap-6">
            <div className="glass-surface rounded-24px p-8 border-b border-white/10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-label-caps text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">{selectedCase.fir_number}</span>
                  <span className="font-label-caps status-open px-3 py-1 rounded-md">{selectedCase.status}</span>
                </div>
                <h1 className="font-headline-lg text-white mb-2">{selectedCase.complainant}</h1>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded-lg font-label-caps transition-colors ${activeTab === 'details' ? 'bg-primary-container text-white' : 'glass-surface text-text-secondary hover:text-white'}`}>Details</button>
                <button onClick={() => setActiveTab('diary')} className={`px-4 py-2 rounded-lg font-label-caps transition-colors ${activeTab === 'diary' ? 'bg-primary-container text-white' : 'glass-surface text-text-secondary hover:text-white'}`}>Diary</button>
                <button onClick={() => setActiveTab('cctv')} className={`px-4 py-2 rounded-lg font-label-caps transition-colors ${activeTab === 'cctv' ? 'bg-primary-container text-white' : 'glass-surface text-text-secondary hover:text-white'}`}>CCTV Alerts</button>
                <button onClick={() => setActiveTab('docs')} className={`px-4 py-2 rounded-lg font-label-caps transition-colors ${activeTab === 'docs' ? 'bg-primary-container text-white' : 'glass-surface text-text-secondary hover:text-white'}`}>Documents</button>
              </div>
            </div>

            <div className="glass-surface rounded-24px p-8 min-h-[400px]">
              {activeTab === 'details' && (
                <div className="input-dark rounded-xl p-5">
                  <p className="text-sm text-on-surface-variant leading-relaxed">{selectedCase.description}</p>
                </div>
              )}
              
              {activeTab === 'diary' && (
                <div className="flex flex-col gap-6">
                  <div className="relative pl-6 border-l border-white/10 space-y-6 ml-2">
                    {diaryLogs.map((log, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[35px] bg-[#0F172A] border border-primary w-6 h-6 rounded-full flex items-center justify-center">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        </div>
                        <div className="glass-surface p-4 rounded-lg ml-4 text-sm text-on-surface-variant">
                          {log}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddDiaryLog} className="flex gap-4 mt-4">
                    <input type="text" className="input-dark rounded-lg p-3 flex-1 text-white" value={newDiaryLog} onChange={(e) => setNewDiaryLog(e.target.value)} placeholder="Add new diary entry..." required />
                    <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors border border-white/20">Add Log</button>
                  </form>
                </div>
              )}

              {activeTab === 'cctv' && (
                <div className="flex flex-col gap-4">
                  {cctvAlerts.map((alertItem) => (
                    <div key={alertItem.id} onClick={() => setSelectedCCTVAlert(alertItem)} className={`p-4 rounded-2xl cursor-pointer transition-colors border flex justify-between items-center ${alertItem.status === 'Critical' ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' : 'glass-surface hover:bg-white/10'}`}>
                      <div className="flex items-center gap-4">
                        <span className={`material-symbols-outlined ${alertItem.status === 'Critical' ? 'text-red-400' : 'text-slate-400'}`}>videocam</span>
                        <div>
                          <h4 className="text-white font-medium">{alertItem.camera}</h4>
                          <p className="text-sm text-text-secondary">{alertItem.type}</p>
                        </div>
                      </div>
                      <span className={`font-label-caps px-3 py-1 rounded-full ${alertItem.status === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'}`}>{alertItem.status}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'docs' && (
                <div className="flex flex-col gap-6">
                  {docError && <p className="text-red-400 p-3 bg-red-500/10 rounded-lg">{docError}</p>}
                  <div className="flex flex-col gap-3">
                    {documentLogs.map((doc, idx) => (
                      <div key={idx} className="glass-surface p-4 rounded-lg flex justify-between items-center">
                        <span className="font-medium text-white">{doc.type}</span>
                        <span className="font-label-caps text-primary bg-primary/10 px-3 py-1 rounded border border-primary/20">{doc.hash}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors" onClick={() => handleGenerateDoc('FIR Copy')}>FIR Copy</button>
                    <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors" onClick={() => handleGenerateDoc('Arrest Memo')}>Arrest Memo</button>
                    <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors" onClick={() => handleGenerateDoc('Charge Sheet')}>Charge Sheet</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentPath === '/ai-chat' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full h-[600px]">
            <div className="flex justify-between items-center glass-panel p-4">
              <h2 className="font-headline-lg text-white">AI Assistant</h2>
              <div className="flex gap-2">
                <button className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${chatMode === 'This Case' ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary hover:text-white'}`} onClick={() => setChatMode('This Case')}>This Case</button>
                <button className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${chatMode === 'All Cases' ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary hover:text-white'}`} onClick={() => setChatMode('All Cases')}>All Cases</button>
              </div>
            </div>
            
            <div className="glass-surface rounded-24px p-6 flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2 mb-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`max-w-[80%] p-4 rounded-2xl ${m.sender === 'user' ? 'self-end bg-primary-container text-white rounded-br-none' : 'self-start glass-elevated text-on-surface-variant rounded-bl-none'}`}>
                    {m.text}
                  </div>
                ))}
                {chatLoading && <div className="self-start glass-elevated text-on-surface-variant p-4 rounded-2xl rounded-bl-none animate-pulse">Analyzing...</div>}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-3">
                <input type="text" className="input-dark rounded-full p-4 flex-1 text-white" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about cases, evidence, or predictive patterns..." required />
                <button type="submit" className="bg-primary hover:bg-primary/90 text-white w-14 h-14 rounded-full flex items-center justify-center transition-colors active:scale-95 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
"""

# Replace the login render logic if path === '/'
login_render_old = r"""  if (currentPath === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center">
            <h1 style={{ color: 'var(--color-primary)' }}>SAMRAKSHA</h1>
            <p className="text-muted">Predictive Policing Intelligence</p>
          </div>
          <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
            <div className="input-group">
              <label htmlFor="badge">Badge Number</label>
              <input id="badge" type="text" className="input-field" placeholder="Enter badge no" required />
            </div>
            <div className="input-group">
              <label htmlFor="pass">Password</label>
              <input id="pass" type="password" className="input-field" placeholder="Enter password" required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>
              Secure Login
            </button>
          </form>
        </div>
      </div>
    );
  }"""

login_render_new = r"""
  const renderNavBar = () => {
    if (currentPath === '/') return null;
    return (
      <header className="sticky top-4 z-50 flex justify-between items-center px-4 md:px-8 py-2 max-w-[1280px] w-[95%] mx-auto glass-header rounded-full mt-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-4">
          <img alt="SAMRAKSHA Logo" className="h-10 w-10 object-contain rounded-full bg-white/10 p-1" src="https://lh3.googleusercontent.com/aida/AP1WRLvDDX_pEIsWgFFQNJE8uOZbf3Gh8rSJsWIW7ogglztw6jqqCxR4TKSYmMe1X89KddrPtVdEclk7DTevpPAqaOHu4l-a1imBU5SrGfbI-3mEARQ9-V862p4KcUC-LDKQYmhUBMEb7jqH2mIGHKFdW2Z9crlyqduTORLXUhegceNqftfhU6KkTdbQWZwVUZpYrsG8JOdgJ7Yd21TLvJkXlExsyJ_YpPUs25Y8-ThTHkhIdL6kfO3ezSe-220"/>
          <span className="font-headline-lg-mobile md:text-headline-lg font-bold text-white tracking-tight">SAMRAKSHA</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className={`font-label-md px-4 py-2 rounded-full transition-colors ${currentPath === '/dashboard' ? 'bg-primary/20 text-white border border-primary/30' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>Dashboard</button>
          <button onClick={() => navigate('/map')} className={`font-label-md px-4 py-2 rounded-full transition-colors ${currentPath === '/map' ? 'bg-primary/20 text-white border border-primary/30' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>Map</button>
          <button onClick={() => navigate('/fir')} className={`font-label-md px-4 py-2 rounded-full transition-colors ${currentPath === '/fir' ? 'bg-primary/20 text-white border border-primary/30' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>FIR Form</button>
          <button onClick={() => navigate('/case-detail')} className={`font-label-md px-4 py-2 rounded-full transition-colors ${currentPath === '/case-detail' ? 'bg-primary/20 text-white border border-primary/30' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>Case Detail</button>
          <button onClick={() => navigate('/ai-chat')} className={`font-label-md px-4 py-2 rounded-full transition-colors ${currentPath === '/ai-chat' ? 'bg-primary/20 text-white border border-primary/30' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>AI Chat</button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10 text-text-secondary hover:text-white transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/10 text-text-secondary hover:text-white transition-all" title="Logout">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>
    );
  };

  if (currentPath === '/') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="glass-panel w-full max-w-md p-8 z-10">
          <div className="text-center mb-8">
            <img alt="SAMRAKSHA Logo" className="h-16 w-16 mx-auto object-contain rounded-full bg-white/10 p-2 mb-4" src="https://lh3.googleusercontent.com/aida/AP1WRLvDDX_pEIsWgFFQNJE8uOZbf3Gh8rSJsWIW7ogglztw6jqqCxR4TKSYmMe1X89KddrPtVdEclk7DTevpPAqaOHu4l-a1imBU5SrGfbI-3mEARQ9-V862p4KcUC-LDKQYmhUBMEb7jqH2mIGHKFdW2Z9crlyqduTORLXUhegceNqftfhU6KkTdbQWZwVUZpYrsG8JOdgJ7Yd21TLvJkXlExsyJ_YpPUs25Y8-ThTHkhIdL6kfO3ezSe-220"/>
            <h1 className="font-headline-xl text-white tracking-tight">SAMRAKSHA</h1>
            <p className="font-label-md text-text-secondary mt-2 tracking-widest uppercase">Command Center Portal</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="badge" className="font-label-caps text-text-secondary">BADGE NUMBER</label>
              <input id="badge" type="text" className="input-dark rounded-lg p-3 text-white focus:ring-1 focus:ring-primary" placeholder="Enter badge no (e.g. SHO01)" required />
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <label htmlFor="pass" className="font-label-caps text-text-secondary">PASSPHRASE</label>
              <input id="pass" type="password" className="input-dark rounded-lg p-3 text-white focus:ring-1 focus:ring-primary" placeholder="Enter password" required />
            </div>
            <button type="submit" className="w-full bg-primary text-white font-label-lg py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]">
              Secure System Authentication
            </button>
          </form>
        </div>
      </div>
    );
  }"""

# Update logic part
logic_part = logic_part.replace(login_render_old, login_render_new)

# Remove old renderNavBar
logic_part = re.sub(r'  const renderNavBar = \(\) => \{[\s\S]*?\n  \};\n', '', logic_part)

final_code = logic_part + new_render
with open('frontend/src/App.tsx', 'w') as f:
    f.write(final_code)

print("Rewritten App.tsx successfully")
