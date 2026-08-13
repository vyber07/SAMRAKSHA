// ─── Version History Panel ────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { X, History, Upload, Save, RotateCcw, RefreshCw } from 'lucide-react';
import { loadVersionHistory } from './storage';
import type { VersionEntry } from './types';
import { useEditor } from './EditorContext';

const EVENT_ICONS: Record<string, React.ElementType> = {
  draft_saved: Save,
  published: Upload,
  reset: RotateCcw,
  auto_save: RefreshCw,
};

const EVENT_COLORS: Record<string, string> = {
  draft_saved: '#A8CAFF',
  published: '#10B981',
  reset: '#EF4444',
  auto_save: '#F59E0B',
};

const EVENT_LABELS: Record<string, string> = {
  draft_saved: 'Draft Saved',
  published: 'Published',
  reset: 'Reset to Default',
  auto_save: 'Auto-saved',
};

interface VersionHistoryProps {
  onClose: () => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryProps> = ({ onClose }) => {
  const { state, dispatch } = useEditor();
  const [history, setHistory] = useState<VersionEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<VersionEntry | null>(null);

  useEffect(() => {
    setHistory(loadVersionHistory(state.pageId));
  }, [state.pageId]);

  const handleRestore = (entry: VersionEntry) => {
    if (!window.confirm(`Restore to "${entry.label}"? This will replace your current canvas.`)) return;
    dispatch({
      type: 'SET_ELEMENTS',
      elements: entry.snapshot.elements,
      addHistory: true,
    });
    onClose();
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'rgba(6,13,26,0.98)',
        border: '1px solid rgba(168,202,255,0.15)',
        borderRadius: '16px',
        width: '520px', maxWidth: '95vw',
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(168,202,255,0.1)',
        }}>
          <History size={18} color="#A8CAFF" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f0fe' }}>
              Version History
            </div>
            <div style={{ fontSize: '11px', color: '#4a6a8a' }}>
              {state.pageLabel} — {history.length} saved versions
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#7a9cc8',
              display: 'flex', padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Entry list */}
          <div style={{
            width: '220px', minWidth: '220px',
            borderRight: '1px solid rgba(168,202,255,0.1)',
            overflowY: 'auto',
            padding: '8px',
          }}>
            {history.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                fontSize: '12px', color: '#4a6a8a',
              }}>
                No history yet.
                <br /><br />
                Save a draft or publish to start tracking changes.
              </div>
            ) : (
              history.map(entry => {
                const Icon = EVENT_ICONS[entry.eventType] ?? Save;
                const color = EVENT_COLORS[entry.eventType] ?? '#A8CAFF';
                const isActive = selectedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      width: '100%', padding: '10px 8px', borderRadius: '8px',
                      background: isActive ? 'rgba(168,202,255,0.1)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(168,202,255,0.2)' : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left',
                      marginBottom: '2px',
                    }}
                  >
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: `${color}22`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, marginTop: '2px',
                    }}>
                      <Icon size={12} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#e8f0fe' }}>
                        {EVENT_LABELS[entry.eventType]}
                      </div>
                      <div style={{ fontSize: '10px', color: '#4a6a8a', marginTop: '2px' }}>
                        {formatTime(entry.timestamp)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#7a9cc8', marginTop: '1px' }}>
                        {entry.snapshot.elements.length} elements
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {!selectedEntry ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: '8px',
              }}>
                <History size={32} color="rgba(168,202,255,0.2)" />
                <p style={{ fontSize: '12px', color: '#4a6a8a', textAlign: 'center' }}>
                  Select a version on the left to preview its details.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 700, color: '#e8f0fe', marginBottom: '4px',
                  }}>
                    {EVENT_LABELS[selectedEntry.eventType]}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7a9cc8' }}>
                    {formatTime(selectedEntry.timestamp)}
                  </div>
                </div>

                {/* Element summary */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#4a6a8a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Content Summary
                  </div>
                  <div style={{ fontSize: '12px', color: '#b8cef8', lineHeight: 1.6 }}>
                    {selectedEntry.snapshot.elements.length} top-level elements
                  </div>
                  {selectedEntry.snapshot.elements.slice(0, 6).map(el => (
                    <div key={el.id} style={{
                      fontSize: '11px', color: '#4a6a8a', padding: '4px 0',
                      borderBottom: '1px solid rgba(168,202,255,0.05)',
                    }}>
                      <span style={{ color: '#7a9cc8', fontFamily: 'JetBrains Mono, monospace' }}>
                        [{el.type}]
                      </span>{' '}
                      {(el.label ?? el.content ?? '').slice(0, 40)}
                    </div>
                  ))}
                  {selectedEntry.snapshot.elements.length > 6 && (
                    <div style={{ fontSize: '11px', color: '#4a6a8a', paddingTop: '4px' }}>
                      ... and {selectedEntry.snapshot.elements.length - 6} more
                    </div>
                  )}
                </div>

                {/* Restore button */}
                <button
                  onClick={() => handleRestore(selectedEntry)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px',
                    background: 'rgba(168,202,255,0.1)',
                    border: '1px solid rgba(168,202,255,0.25)',
                    color: '#A8CAFF', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600,
                  }}
                >
                  <RefreshCw size={13} />
                  Restore this version
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
