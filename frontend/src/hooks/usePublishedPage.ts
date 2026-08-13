// ─── Hook: usePublishedPage ────────────────────────────────────────────────────
// Reads the published snapshot for a given pageId from localStorage.
// Subscribes to the `storage` event so changes made in another tab (e.g. the
// editor) are reflected here immediately without a page reload.

import { useState, useEffect, useCallback } from 'react';
import type { PageSnapshot } from '../editor/types';

const PUBLISHED_KEY = 'samraksha-editor-published';

function readPublishedPage(pageId: string): PageSnapshot | null {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY);
    if (!raw) return null;
    const pages = JSON.parse(raw) as PageSnapshot[];
    const page = pages.find(p => p.id === pageId) ?? null;
    // Guard: only return a snapshot that actually has content
    if (!page || !Array.isArray(page.elements) || page.elements.length === 0) {
      return null;
    }
    return page;
  } catch {
    return null;
  }
}

/**
 * Returns the published PageSnapshot for `pageId`, or `null` if none exists /
 * the snapshot is empty / the snapshot is malformed.
 *
 * Automatically re-reads when the localStorage key is mutated in any tab.
 */
export function usePublishedPage(pageId: string): PageSnapshot | null {
  const [snapshot, setSnapshot] = useState<PageSnapshot | null>(() =>
    readPublishedPage(pageId)
  );

  const refresh = useCallback(() => {
    setSnapshot(readPublishedPage(pageId));
  }, [pageId]);

  useEffect(() => {
    // Refresh whenever pageId changes
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Listen for changes made in other tabs (e.g. the editor tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PUBLISHED_KEY) {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  return snapshot;
}
