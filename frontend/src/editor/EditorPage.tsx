// ─── Visual Editor — Main Page (route: /admin/editor) ────────────────────────

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useBeforeUnload } from 'react-router-dom';
import { EditorProvider, useEditor } from './EditorContext';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { RightPanel } from './RightPanel';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { MobileBottomBar } from './MobileBottomBar';
import { loadDraft, loadPage } from './storage';
import { extractPageContent } from './pageContentExtractor';
import type { PageSnapshot } from './types';

// ─── Determine initial snapshot ───────────────────────────────────────────────
function getInitialSnapshot(pageId: string): PageSnapshot {
  // Priority: saved draft > saved page > extracted page content
  const draft = loadDraft(pageId);
  if (draft && draft.elements.length > 0) return draft;

  const saved = loadPage(pageId);
  if (saved && saved.elements.length > 0) return saved;

  // Fall back to extracted content from the live page
  return extractPageContent(pageId);
}

// ─── Keyboard Shortcut Handler ────────────────────────────────────────────────
const KeyboardShortcuts: React.FC = () => {
  const { dispatch, state, save, saveDraftFn } = useEditor();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if (e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          save();
        } else {
          saveDraftFn();
        }
      } else if (e.key === 'd' && state.selectedId) {
        e.preventDefault();
        dispatch({ type: 'DUPLICATE_ELEMENT', id: state.selectedId });
      } else if (e.key === 'e') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_EDITING_MODE' });
      }

      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        const isEditing = (document.activeElement as HTMLElement)?.isContentEditable;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !isEditing) {
          dispatch({ type: 'DELETE_ELEMENT', id: state.selectedId });
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, save, saveDraftFn, state.selectedId]);

  return null;
};

// ─── Unsaved changes guard ────────────────────────────────────────────────────
const UnsavedChangesGuard: React.FC = () => {
  const { state } = useEditor();

  // Browser refresh / tab close
  useBeforeUnload(
    useCallback(
      (e) => {
        if (state.isDirty) {
          e.preventDefault();
          // Modern browsers ignore the message but still show a generic dialog
          return 'You have unsaved changes. Are you sure you want to leave?';
        }
      },
      [state.isDirty]
    )
  );

  return null;
};

// ─── Mobile detection ─────────────────────────────────────────────────────────
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ─── Editor Shell (inside provider) ──────────────────────────────────────────
const EditorShell: React.FC = () => {
  const { state, dispatch } = useEditor();
  const isMobile = useIsMobile();

  const showLeftPanel = !state.previewMode && !isMobile;
  const showRightPanel = !state.previewMode && !isMobile && state.editingMode;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      overflow: 'hidden', fontFamily: 'Plus Jakarta Sans, sans-serif',
      background: '#060d1a',
    }}>
      <KeyboardShortcuts />
      <UnsavedChangesGuard />
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {showLeftPanel && <LeftPanel />}
        <Canvas />
        {showRightPanel && <RightPanel />}
      </div>

      {/* Mobile bottom bar */}
      {isMobile && <MobileBottomBar />}

      {/* Version history modal */}
      {state.showVersionHistory && (
        <VersionHistoryPanel onClose={() => dispatch({ type: 'SET_VERSION_HISTORY', on: false })} />
      )}
    </div>
  );
};

// ─── Editor Page (top level, handles loading) ─────────────────────────────────
const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get('page') ?? 'dashboard';
  const [snapshot, setSnapshot] = useState<PageSnapshot | null>(null);
  const [hasDraftBanner, setHasDraftBanner] = useState(false);

  useEffect(() => {
    const draft = loadDraft(pageId);
    const snap = getInitialSnapshot(pageId);
    setSnapshot(snap);
    // Show banner if we loaded a pre-existing draft
    if (draft && draft.elements.length > 0) {
      setHasDraftBanner(true);
      setTimeout(() => setHasDraftBanner(false), 4000);
    }
  }, [pageId]);

  if (!snapshot) {
    return (
      <div style={{
        display: 'flex', height: '100vh', width: '100vw',
        alignItems: 'center', justifyContent: 'center',
        background: '#060d1a', color: '#A8CAFF',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '14px',
      }}>
        Loading editor...
      </div>
    );
  }

  return (
    <EditorProvider initialSnapshot={snapshot}>
      {hasDraftBanner && (
        <div style={{
          position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(168,202,255,0.15)', border: '1px solid rgba(168,202,255,0.3)',
          borderRadius: '8px', padding: '8px 18px',
          fontSize: '12px', color: '#A8CAFF', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          📋 Loaded your saved draft
        </div>
      )}
      <EditorShell />
    </EditorProvider>
  );
};

export default EditorPage;
