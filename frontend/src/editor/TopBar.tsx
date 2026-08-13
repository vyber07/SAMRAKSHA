// ─── Visual Editor — Top Bar ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Undo2, Redo2, Eye, EyeOff, Save, Upload, Monitor, Tablet, Smartphone,
  Shield, CheckCircle2, AlertCircle, Pencil, RotateCcw, History,
  PencilOff, FileStack, ArrowLeft,
} from 'lucide-react';
import { useEditor } from './EditorContext';
import { unpublishPage } from './storage';
import { useNavigate } from 'react-router-dom';

const PAGE_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'cases', label: 'FIR & Cases' },
  { id: 'cctv', label: 'CCTV Surveillance' },
  { id: 'patrol', label: 'Patrol Fleet' },
  { id: 'map', label: 'Crime Map' },
  { id: 'ai-assistant', label: 'AI Assistant' },
  { id: 'document-studio', label: 'Document Studio' },
  { id: 'admin', label: 'Admin & Users' },
  { id: 'custom', label: '+ New Custom Page' },
];

const PAGE_ROUTES: Record<string, string> = {
  dashboard: '/dashboard',
  cases: '/cases',
  cctv: '/cctv',
  patrol: '/patrol',
  map: '/map',
  'ai-assistant': '/ai-assistant',
  'document-studio': '/document-studio',
  admin: '/admin',
};

export const TopBar: React.FC = () => {
  const { state, dispatch, save, saveDraftFn, publish, toggleEditingMode } = useEditor();
  const [saveMsg, setSaveMsg] = useState<'idle' | 'saved' | 'draft' | 'published' | 'reset'>('idle');
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const handleSave = () => {
    save();
    setSaveMsg('saved');
    setTimeout(() => setSaveMsg('idle'), 2500);
  };

  const handleSaveDraft = () => {
    saveDraftFn();
    setSaveMsg('draft');
    setTimeout(() => setSaveMsg('idle'), 2500);
  };

  const handlePublish = () => {
    publish();
    setSaveMsg('published');
    setTimeout(() => setSaveMsg('idle'), 3000);
  };

  const handleReset = () => {
    if (!window.confirm(`Remove the published version of "${state.pageLabel}" and restore the original page?\n\nThis will immediately show the original hardcoded content on the live page.`)) return;
    unpublishPage(state.pageId);
    setSaveMsg('reset');
    setTimeout(() => setSaveMsg('idle'), 3000);
  };

  const handleExitEditor = () => {
    if (state.isDirty) {
      const choice = window.confirm('You have unsaved changes. Save as draft before leaving?');
      if (choice) {
        saveDraftFn();
      }
    }
    navigate(PAGE_ROUTES[state.pageId] ?? '/dashboard');
  };

  const handlePageChange = (pageId: string) => {
    if (state.isDirty) {
      const choice = window.confirm('You have unsaved changes. Save as draft before switching pages?');
      if (choice) {
        saveDraftFn();
      }
    }
    window.location.href = `/admin/editor?page=${pageId}`;
  };

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 10px', borderRadius: '6px',
    background: 'transparent', border: '1px solid rgba(168,202,255,0.15)',
    color: '#b8cef8', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
    transition: 'all 0.15s', whiteSpace: 'nowrap' as const,
  };

  const iconBtn: React.CSSProperties = {
    ...btnBase, padding: '6px 8px',
  };

  const previewWidths = [
    { id: 'desktop', Icon: Monitor, title: 'Desktop (100%)' },
    { id: 'tablet', Icon: Tablet, title: 'Tablet (768px)' },
    { id: 'mobile', Icon: Smartphone, title: 'Mobile (390px)' },
  ] as const;

  return (
    <div style={{
      height: 'auto',
      minHeight: '52px',
      background: 'rgba(4,10,22,0.98)',
      borderBottom: '1px solid rgba(168,202,255,0.1)',
      display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const,
      padding: '0 14px', gap: '6px',
      userSelect: 'none',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '4px' }}
        onClick={() => navigate('/dashboard')}
      >
        <div style={{
          width: '28px', height: '28px',
          background: 'linear-gradient(135deg, #004B87, #0063B2)',
          borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Shield size={15} color="white" />
        </div>
        {!isMobile && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#e8f0fe', fontFamily: 'Montserrat, sans-serif' }}>
              SAMRAKSHA
            </div>
            <div style={{ fontSize: '9px', color: '#4a6a8a', letterSpacing: '0.1em' }}>
              VISUAL EDITOR
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(168,202,255,0.1)', flexShrink: 0 }} />

      {/* Exit Editor */}
      <button
        onClick={handleExitEditor}
        title={`Exit to live ${state.pageLabel} page`}
        style={{
          ...btnBase,
          color: '#7a9cc8',
          gap: '4px',
        }}
      >
        <ArrowLeft size={13} />
        {!isMobile && <span>Exit</span>}
      </button>

      {/* Page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileStack size={12} color="#7a9cc8" />
        <select
          value={state.pageId}
          onChange={e => handlePageChange(e.target.value)}
          style={{
            padding: '4px 8px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(168,202,255,0.15)',
            color: '#e8f0fe', fontSize: '12px', outline: 'none', cursor: 'pointer',
          }}
        >
          {PAGE_OPTIONS.map(p => (
            <option key={p.id} value={p.id} style={{ background: '#0d1b2e' }}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* ─────────── EDIT PAGE BUTTON ─────────────────────────── */}
      <button
        onClick={toggleEditingMode}
        title={state.editingMode ? 'Exit Editing Mode' : 'Enter Editing Mode — click elements to edit them'}
        style={{
          ...btnBase,
          background: state.editingMode
            ? 'linear-gradient(135deg, rgba(168,202,255,0.2), rgba(0,75,135,0.4))'
            : 'rgba(0,75,135,0.25)',
          borderColor: state.editingMode ? '#A8CAFF' : 'rgba(168,202,255,0.25)',
          color: state.editingMode ? '#ffffff' : '#A8CAFF',
          fontWeight: 700,
          boxShadow: state.editingMode ? '0 0 12px rgba(168,202,255,0.2)' : 'none',
          gap: '6px',
        }}
      >
        {state.editingMode ? <PencilOff size={14} /> : <Pencil size={14} />}
        <span>{state.editingMode ? 'Stop Editing' : 'Edit Page'}</span>
      </button>

      {/* EDITING MODE badge */}
      {state.editingMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '20px',
          background: 'rgba(168,202,255,0.12)',
          border: '1px solid rgba(168,202,255,0.3)',
          fontSize: '11px', fontWeight: 700, color: '#A8CAFF',
          letterSpacing: '0.05em',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#A8CAFF',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          EDITING MODE
        </div>
      )}

      {/* Dirty indicator */}
      {state.isDirty && !state.editingMode && (
        <div style={{ fontSize: '10px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <AlertCircle size={11} />
          Unsaved
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Undo / Redo — only show when in edit mode */}
      {state.editingMode && (
        <>
          <button
            style={{ ...iconBtn, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? 'pointer' : 'not-allowed' }}
            onClick={() => canUndo && dispatch({ type: 'UNDO' })}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            style={{ ...iconBtn, opacity: canRedo ? 1 : 0.35, cursor: canRedo ? 'pointer' : 'not-allowed' }}
            onClick={() => canRedo && dispatch({ type: 'REDO' })}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(168,202,255,0.1)', flexShrink: 0 }} />
        </>
      )}

      {/* Responsive preview widths */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: '2px' }}>
          {previewWidths.map(({ id, Icon, title }) => (
            <button
              key={id}
              title={title}
              onClick={() => dispatch({ type: 'SET_PREVIEW_WIDTH', width: id })}
              style={{
                ...iconBtn,
                background: state.previewWidth === id ? 'rgba(168,202,255,0.15)' : 'transparent',
                borderColor: state.previewWidth === id ? '#A8CAFF' : 'rgba(168,202,255,0.15)',
                color: state.previewWidth === id ? '#A8CAFF' : '#7a9cc8',
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      )}

      <div style={{ width: '1px', height: '24px', background: 'rgba(168,202,255,0.1)', flexShrink: 0 }} />

      {/* Preview toggle */}
      <button
        title={state.previewMode ? 'Exit Preview' : 'Preview Mode'}
        onClick={() => dispatch({ type: 'SET_PREVIEW', on: !state.previewMode })}
        style={{
          ...btnBase,
          background: state.previewMode ? 'rgba(168,202,255,0.12)' : 'transparent',
          borderColor: state.previewMode ? '#A8CAFF' : 'rgba(168,202,255,0.15)',
          color: state.previewMode ? '#A8CAFF' : '#b8cef8',
        }}
      >
        {state.previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
        {!isMobile && <span>{state.previewMode ? 'Exit Preview' : 'Preview'}</span>}
      </button>

      {/* Version History */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_VERSION_HISTORY' })}
        title="Version History"
        style={{
          ...iconBtn,
          background: state.showVersionHistory ? 'rgba(168,202,255,0.12)' : 'transparent',
          borderColor: state.showVersionHistory ? '#A8CAFF' : 'rgba(168,202,255,0.15)',
          color: state.showVersionHistory ? '#A8CAFF' : '#7a9cc8',
        }}
      >
        <History size={14} />
      </button>

      {/* Save — saves to STORAGE_KEY (legacy) */}
      <button
        onClick={handleSave}
        title="Save to storage"
        style={{
          ...iconBtn,
          background: 'rgba(0,75,135,0.35)',
          borderColor: 'rgba(168,202,255,0.25)',
          color: '#A8CAFF',
        }}
      >
        <Save size={14} />
      </button>

      {/* Save Draft */}
      <button
        onClick={handleSaveDraft}
        title="Save Draft — keeps changes without publishing to the live page"
        style={{
          ...btnBase,
          background: saveMsg === 'draft' ? 'rgba(168,202,255,0.2)' : 'rgba(0,75,135,0.35)',
          borderColor: saveMsg === 'draft' ? '#A8CAFF' : 'rgba(168,202,255,0.25)',
          color: '#A8CAFF',
        }}
      >
        {saveMsg === 'draft' ? <CheckCircle2 size={14} /> : <FileStack size={14} />}
        <span>{saveMsg === 'draft' ? 'Saved!' : 'Save Draft'}</span>
      </button>

      {/* Reset to Default */}
      <button
        onClick={handleReset}
        title="Remove published version — restores the original hardcoded page"
        style={{
          ...btnBase,
          background: 'transparent',
          borderColor: 'rgba(239,68,68,0.4)',
          color: '#EF4444',
        }}
      >
        <RotateCcw size={14} />
        {!isMobile && <span>Reset</span>}
      </button>

      {/* Publish */}
      <button
        onClick={handlePublish}
        title="Publish — this immediately updates the live page"
        style={{
          ...btnBase,
          background: saveMsg === 'published' ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #004B87, #0063B2)',
          borderColor: saveMsg === 'published' ? '#10B981' : '#0063B2',
          color: 'white',
          fontWeight: 700,
          boxShadow: '0 2px 12px rgba(0,75,135,0.4)',
        }}
      >
        {saveMsg === 'published' ? <CheckCircle2 size={14} /> : <Upload size={14} />}
        <span>{saveMsg === 'published' ? 'Published!' : 'Publish'}</span>
      </button>

      {/* Status messages */}
      {saveMsg === 'saved' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '11px', color: '#10B981',
        }}>
          <CheckCircle2 size={12} />
          Saved
        </div>
      )}
      {saveMsg === 'reset' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '11px', color: '#EF4444',
        }}>
          <RotateCcw size={12} />
          Reset — original page restored
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
