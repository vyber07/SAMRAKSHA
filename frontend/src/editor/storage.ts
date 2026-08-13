// ─── Visual Editor — Storage / Persistence ───────────────────────────────────

import type { PageSnapshot, EditorElement, VersionEntry, VersionEventType } from './types';

export const STORAGE_KEY = 'samraksha-editor-pages';
export const PUBLISHED_KEY = 'samraksha-editor-published';
export const DRAFT_KEY = 'samraksha-editor-drafts';
export const VERSION_KEY = 'samraksha-editor-versions';

// ─── Page snapshots (saved/drafted state) ─────────────────────────────────────

export function loadAllPages(): PageSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PageSnapshot[];
  } catch {
    return [];
  }
}

export function savePage(snapshot: PageSnapshot): void {
  const pages = loadAllPages();
  const idx = pages.findIndex(p => p.id === snapshot.id);
  if (idx >= 0) {
    pages[idx] = snapshot;
  } else {
    pages.push(snapshot);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

export function loadPage(pageId: string): PageSnapshot | null {
  const pages = loadAllPages();
  return pages.find(p => p.id === pageId) ?? null;
}

export function deletePage(pageId: string): void {
  const pages = loadAllPages().filter(p => p.id !== pageId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

// ─── Draft storage ────────────────────────────────────────────────────────────

function loadAllDrafts(): PageSnapshot[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PageSnapshot[];
  } catch {
    return [];
  }
}

export function saveDraft(snapshot: PageSnapshot): void {
  const all = loadAllDrafts();
  const idx = all.findIndex(p => p.id === snapshot.id);
  const draft = { ...snapshot, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = draft;
  } else {
    all.push(draft);
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  // Record history entry
  addVersionEntry(snapshot.id, 'draft_saved', `Draft saved at ${new Date().toLocaleTimeString()}`, snapshot);
}

export function loadDraft(pageId: string): PageSnapshot | null {
  try {
    const all = loadAllDrafts();
    const draft = all.find(p => p.id === pageId) ?? null;
    if (!draft || !Array.isArray(draft.elements)) return null;
    return draft;
  } catch {
    return null;
  }
}

export function deleteDraft(pageId: string): void {
  const all = loadAllDrafts().filter(p => p.id !== pageId);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
}

// ─── Publish ─────────────────────────────────────────────────────────────────

export function publishPage(snapshot: PageSnapshot): void {
  const all = (() => {
    try {
      const raw = localStorage.getItem(PUBLISHED_KEY);
      return raw ? (JSON.parse(raw) as PageSnapshot[]) : [];
    } catch { return []; }
  })();
  const idx = all.findIndex(p => p.id === snapshot.id);
  const pub = { ...snapshot, published: true, updatedAt: new Date().toISOString() };
  if (idx >= 0) { all[idx] = pub; } else { all.push(pub); }
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(all));
  // Record history
  addVersionEntry(snapshot.id, 'published', `Published at ${new Date().toLocaleTimeString()}`, snapshot);
  // Also save as regular page
  savePage(pub);
}

export function loadPublishedPage(pageId: string): PageSnapshot | null {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY);
    if (!raw) return null;
    const pages = JSON.parse(raw) as PageSnapshot[];
    return pages.find(p => p.id === pageId) ?? null;
  } catch { return null; }
}

export function unpublishPage(pageId: string): void {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY);
    if (!raw) return;
    const pages = JSON.parse(raw) as PageSnapshot[];
    const filtered = pages.filter(p => p.id !== pageId);
    localStorage.setItem(PUBLISHED_KEY, JSON.stringify(filtered));
    addVersionEntry(pageId, 'reset', `Reset to default at ${new Date().toLocaleTimeString()}`, {
      id: pageId, label: pageId, elements: [], updatedAt: new Date().toISOString(),
    });
  } catch { /* ignore */ }
}

// ─── Version history ──────────────────────────────────────────────────────────
const MAX_VERSIONS_PER_PAGE = 20;

export function loadVersionHistory(pageId: string): VersionEntry[] {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as VersionEntry[];
    return all.filter(v => v.pageId === pageId).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch {
    return [];
  }
}

export function addVersionEntry(
  pageId: string,
  eventType: VersionEventType,
  label: string,
  snapshot: PageSnapshot
): void {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    const all: VersionEntry[] = raw ? JSON.parse(raw) as VersionEntry[] : [];
    const entry: VersionEntry = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageId,
      eventType,
      timestamp: new Date().toISOString(),
      label,
      snapshot: JSON.parse(JSON.stringify(snapshot)) as PageSnapshot,
    };
    all.push(entry);
    // Keep only the last N per page
    const perPage = all.filter(v => v.pageId === pageId);
    if (perPage.length > MAX_VERSIONS_PER_PAGE) {
      const old = perPage
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, perPage.length - MAX_VERSIONS_PER_PAGE)
        .map(v => v.id);
      const pruned = all.filter(v => !old.includes(v.id));
      localStorage.setItem(VERSION_KEY, JSON.stringify(pruned));
    } else {
      localStorage.setItem(VERSION_KEY, JSON.stringify(all));
    }
  } catch { /* ignore */ }
}

export function clearVersionHistory(pageId: string): void {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as VersionEntry[];
    localStorage.setItem(VERSION_KEY, JSON.stringify(all.filter(v => v.pageId !== pageId)));
  } catch { /* ignore */ }
}

// ─── ID Generator ─────────────────────────────────────────────────────────────
export function genId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Default element factories ─────────────────────────────────────────────
export function makeTextElement(): EditorElement {
  return {
    id: genId(), type: 'text',
    content: 'Edit this text',
    children: [],
    style: {
      fontSize: '14px', color: '#e8f0fe', fontFamily: 'Plus Jakarta Sans, sans-serif',
      lineHeight: '1.6', paddingTop: '8px', paddingBottom: '8px',
      paddingLeft: '4px', paddingRight: '4px',
    },
  };
}

export function makeHeadingElement(): EditorElement {
  return {
    id: genId(), type: 'heading',
    content: 'Heading',
    children: [],
    style: {
      fontSize: '24px', fontWeight: '700', color: '#e8f0fe',
      fontFamily: 'Montserrat, sans-serif', lineHeight: '1.3',
      paddingTop: '8px', paddingBottom: '8px',
    },
  };
}

export function makeParagraphElement(): EditorElement {
  return {
    id: genId(), type: 'paragraph',
    content: 'This is a paragraph. Click to edit.',
    children: [],
    style: {
      fontSize: '14px', color: '#b8cef8', lineHeight: '1.7',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      paddingTop: '4px', paddingBottom: '4px',
    },
  };
}

export function makeButtonElement(): EditorElement {
  return {
    id: genId(), type: 'button',
    content: 'Click Me',
    children: [],
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      paddingTop: '10px', paddingBottom: '10px', paddingLeft: '20px', paddingRight: '20px',
      backgroundColor: '#004B87', color: '#ffffff',
      fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fontSize: '14px',
      borderRadius: '8px', cursor: 'pointer', border: 'none',
      boxShadow: '0 4px 15px rgba(0,75,135,0.4)', transition: 'all 0.2s',
    },
  };
}

export function makeImageElement(): EditorElement {
  return {
    id: genId(), type: 'image',
    content: 'https://via.placeholder.com/400x200?text=Click+to+change+image',
    children: [],
    style: {
      width: '100%', height: '200px', borderRadius: '8px',
      objectFit: 'cover' as unknown as undefined,
    } as EditorElement['style'],
    attrs: { alt: 'Image', src: 'https://via.placeholder.com/400x200?text=Click+to+change+image' },
  };
}

export function makeContainerElement(): EditorElement {
  return {
    id: genId(), type: 'container',
    content: '',
    children: [],
    style: {
      display: 'flex', flexDirection: 'column', gap: '12px',
      paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', paddingRight: '16px',
      backgroundColor: 'rgba(13,27,46,0.75)',
      border: '1px solid rgba(168,202,255,0.1)',
      borderRadius: '12px',
      minHeight: '60px',
    },
  };
}

export function makeSectionElement(): EditorElement {
  return {
    id: genId(), type: 'section',
    content: '',
    children: [],
    style: {
      display: 'flex', flexDirection: 'column', gap: '16px',
      paddingTop: '32px', paddingBottom: '32px', paddingLeft: '24px', paddingRight: '24px',
      backgroundColor: 'rgba(6,13,26,0.5)',
      minHeight: '120px',
    },
  };
}

export function makeDividerElement(): EditorElement {
  return {
    id: genId(), type: 'divider',
    content: '',
    children: [],
    style: {
      width: '100%', height: '1px',
      backgroundColor: 'rgba(168,202,255,0.15)',
      marginTop: '12px', marginBottom: '12px',
    },
  };
}

export function makeBadgeElement(): EditorElement {
  return {
    id: genId(), type: 'badge',
    content: 'Status',
    children: [],
    style: {
      display: 'inline-flex', alignItems: 'center',
      paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px',
      backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    },
  };
}

export function makeCardElement(): EditorElement {
  const card = makeContainerElement();
  card.type = 'card';
  card.label = 'Card';
  card.children = [
    {
      id: genId(), type: 'heading', content: 'Card Title', children: [],
      style: { fontSize: '16px', fontWeight: '700', color: '#e8f0fe', fontFamily: 'Montserrat, sans-serif', marginBottom: '4px' },
    },
    {
      id: genId(), type: 'text', content: 'Card description text goes here.', children: [],
      style: { fontSize: '13px', color: '#7a9cc8', lineHeight: '1.5' },
    },
  ];
  return card;
}

export function makeElementByType(type: EditorElement['type']): EditorElement {
  switch (type) {
    case 'heading': return makeHeadingElement();
    case 'paragraph': return makeParagraphElement();
    case 'button': return makeButtonElement();
    case 'image': return makeImageElement();
    case 'container': return makeContainerElement();
    case 'section': return makeSectionElement();
    case 'divider': return makeDividerElement();
    case 'badge': return makeBadgeElement();
    case 'card': return makeCardElement();
    default: return makeTextElement();
  }
}

// Deep clone helper
export function cloneElement(el: EditorElement): EditorElement {
  return JSON.parse(JSON.stringify(el)) as EditorElement;
}

// ─── Import: EditorElement re-export ─────────────────────────────────────────
export type { EditorElement };
