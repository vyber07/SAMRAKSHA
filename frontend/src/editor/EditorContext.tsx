// ─── Visual Editor — State Context ────────────────────────────────────────────

import React, { createContext, useCallback, useContext, useReducer, useRef } from 'react';
import type { EditorElement, PageSnapshot } from './types';
import {
  updateElement, removeElement, insertElement,
  moveElement, duplicateElement, findElement,
} from './treeUtils';
import { savePage, saveDraft, loadDraft, publishPage, makeElementByType, genId } from './storage';

// ─── State ────────────────────────────────────────────────────────────────────
interface EditorState {
  pageId: string;
  pageLabel: string;
  elements: EditorElement[];
  selectedId: string | null;
  hoveredId: string | null;
  isDirty: boolean;
  previewMode: boolean;
  previewWidth: 'desktop' | 'tablet' | 'mobile';
  past: EditorElement[][];
  future: EditorElement[][];
  editingMode: boolean;        // NEW: "Edit Page" mode is on
  showVersionHistory: boolean; // NEW: version history panel visible
  hasDraft: boolean;           // NEW: whether a saved draft exists
}

// ─── Actions ─────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SELECT'; id: string | null }
  | { type: 'HOVER'; id: string | null }
  | { type: 'SET_ELEMENTS'; elements: EditorElement[]; addHistory?: boolean }
  | { type: 'UPDATE_STYLE'; id: string; style: Partial<EditorElement['style']> }
  | { type: 'UPDATE_CONTENT'; id: string; content: string }
  | { type: 'UPDATE_ATTRS'; id: string; attrs: Record<string, string> }
  | { type: 'ADD_ELEMENT'; element: EditorElement; parentId: string | null; index: number }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'DUPLICATE_ELEMENT'; id: string }
  | { type: 'MOVE_ELEMENT'; id: string; parentId: string | null; index: number }
  | { type: 'MOVE_UP'; id: string }
  | { type: 'MOVE_DOWN'; id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PREVIEW'; on: boolean }
  | { type: 'SET_PREVIEW_WIDTH'; width: EditorState['previewWidth'] }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_DRAFT_SAVED' }
  | { type: 'LOAD_PAGE'; snapshot: PageSnapshot }
  | { type: 'TOGGLE_EDITING_MODE' }
  | { type: 'SET_EDITING_MODE'; on: boolean }
  | { type: 'TOGGLE_VERSION_HISTORY' }
  | { type: 'SET_VERSION_HISTORY'; on: boolean };

const MAX_HISTORY = 50;

function pushHistory(past: EditorElement[][], current: EditorElement[]): EditorElement[][] {
  const next = [...past, current];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SELECT':
      return { ...state, selectedId: action.id };

    case 'HOVER':
      return { ...state, hoveredId: action.id };

    case 'SET_ELEMENTS': {
      const past = action.addHistory !== false
        ? pushHistory(state.past, state.elements)
        : state.past;
      return { ...state, elements: action.elements, past, future: [], isDirty: true };
    }

    case 'UPDATE_STYLE': {
      const updated = updateElement(state.elements, action.id, el => ({
        ...el, style: { ...el.style, ...action.style },
      }));
      return {
        ...state,
        elements: updated,
        past: pushHistory(state.past, state.elements),
        future: [],
        isDirty: true,
      };
    }

    case 'UPDATE_CONTENT': {
      const updated = updateElement(state.elements, action.id, el => ({
        ...el, content: action.content,
      }));
      return {
        ...state,
        elements: updated,
        past: pushHistory(state.past, state.elements),
        future: [],
        isDirty: true,
      };
    }

    case 'UPDATE_ATTRS': {
      const updated = updateElement(state.elements, action.id, el => ({
        ...el, attrs: { ...(el.attrs ?? {}), ...action.attrs },
      }));
      return {
        ...state, elements: updated,
        past: pushHistory(state.past, state.elements), future: [], isDirty: true,
      };
    }

    case 'ADD_ELEMENT': {
      const newElements = insertElement(
        state.elements, action.element, action.parentId, action.index
      );
      return {
        ...state, elements: newElements,
        selectedId: action.element.id,
        past: pushHistory(state.past, state.elements), future: [], isDirty: true,
      };
    }

    case 'DELETE_ELEMENT': {
      const [newElements] = removeElement(state.elements, action.id);
      return {
        ...state, elements: newElements,
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        past: pushHistory(state.past, state.elements), future: [], isDirty: true,
      };
    }

    case 'DUPLICATE_ELEMENT': {
      const el = findElement(state.elements, action.id);
      if (!el) return state;
      const dup = duplicateElement(el);
      const idx = state.elements.findIndex(e => e.id === action.id);
      let newElements: EditorElement[];
      if (idx >= 0) {
        newElements = [...state.elements];
        newElements.splice(idx + 1, 0, dup);
      } else {
        newElements = [...state.elements, dup];
      }
      return {
        ...state, elements: newElements, selectedId: dup.id,
        past: pushHistory(state.past, state.elements), future: [], isDirty: true,
      };
    }

    case 'MOVE_UP': {
      const idx = state.elements.findIndex(e => e.id === action.id);
      if (idx <= 0) return state;
      const newElements = [...state.elements];
      [newElements[idx - 1], newElements[idx]] = [newElements[idx], newElements[idx - 1]];
      return {
        ...state, elements: newElements,
        past: pushHistory(state.past, state.elements), future: [], isDirty: true,
      };
    }

    case 'MOVE_DOWN': {
      const idx = state.elements.findIndex(e => e.id === action.id);
      if (idx < 0 || idx >= state.elements.length - 1) return state;
      const newElements = [...state.elements];
      [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
      return {
        ...state, elements: newElements,
        past: pushHistory(state.past, state.elements), future: [], isDirty: true,
      };
    }

    case 'MOVE_ELEMENT': {
      const newElements = moveElement(state.elements, action.id, action.parentId, action.index);
      return {
        ...state, elements: newElements,
        past: pushHistory(state.past, state.elements), future: [], isDirty: true,
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        ...state,
        elements: prev,
        past: newPast,
        future: [state.elements, ...state.future],
        isDirty: true,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        ...state,
        elements: next,
        past: pushHistory(state.past, state.elements),
        future: newFuture,
        isDirty: true,
      };
    }

    case 'SET_PREVIEW':
      return { ...state, previewMode: action.on };

    case 'SET_PREVIEW_WIDTH':
      return { ...state, previewWidth: action.width };

    case 'MARK_SAVED':
      return { ...state, isDirty: false };

    case 'MARK_DRAFT_SAVED':
      return { ...state, isDirty: false, hasDraft: true };

    case 'LOAD_PAGE':
      return {
        ...state,
        pageId: action.snapshot.id,
        pageLabel: action.snapshot.label,
        elements: action.snapshot.elements,
        selectedId: null,
        isDirty: false,
        past: [],
        future: [],
      };

    case 'TOGGLE_EDITING_MODE':
      return {
        ...state,
        editingMode: !state.editingMode,
        // When entering editing mode, exit preview
        previewMode: !state.editingMode ? false : state.previewMode,
        selectedId: !state.editingMode ? state.selectedId : null,
      };

    case 'SET_EDITING_MODE':
      return {
        ...state,
        editingMode: action.on,
        previewMode: action.on ? false : state.previewMode,
        selectedId: action.on ? state.selectedId : null,
      };

    case 'TOGGLE_VERSION_HISTORY':
      return { ...state, showVersionHistory: !state.showVersionHistory };

    case 'SET_VERSION_HISTORY':
      return { ...state, showVersionHistory: action.on };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  // Convenience helpers
  addElement: (type: EditorElement['type'], parentId?: string | null) => void;
  selectElement: (id: string | null) => void;
  selectedElement: EditorElement | null;
  save: () => void;
  saveDraftFn: () => void;
  publish: () => void;
  toggleEditingMode: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{
  children: React.ReactNode;
  initialSnapshot: PageSnapshot;
}> = ({ children, initialSnapshot }) => {
  const hasDraftInitially = !!loadDraft(initialSnapshot.id);

  const [state, dispatch] = useReducer(reducer, {
    pageId: initialSnapshot.id,
    pageLabel: initialSnapshot.label,
    elements: initialSnapshot.elements,
    selectedId: null,
    hoveredId: null,
    isDirty: false,
    previewMode: false,
    previewWidth: 'desktop',
    past: [],
    future: [],
    editingMode: false,
    showVersionHistory: false,
    hasDraft: hasDraftInitially,
  });

  // Keep a ref for callbacks to access latest state without stale closure
  const stateRef = useRef(state);
  stateRef.current = state;

  const addElement = useCallback((type: EditorElement['type'], parentId: string | null = null) => {
    const element = makeElementByType(type);
    const cur = stateRef.current;
    const parentEl = parentId ? findElement(cur.elements, parentId) : null;
    const index = parentEl ? parentEl.children.length : cur.elements.length;
    dispatch({ type: 'ADD_ELEMENT', element, parentId, index });
  }, []);

  const selectElement = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT', id });
  }, []);

  const save = useCallback(() => {
    const cur = stateRef.current;
    const snapshot: PageSnapshot = {
      id: cur.pageId,
      label: cur.pageLabel,
      elements: cur.elements,
      updatedAt: new Date().toISOString(),
    };
    savePage(snapshot);
    dispatch({ type: 'MARK_SAVED' });
  }, []);

  const saveDraftFn = useCallback(() => {
    const cur = stateRef.current;
    const snapshot: PageSnapshot = {
      id: cur.pageId,
      label: cur.pageLabel,
      elements: cur.elements,
      updatedAt: new Date().toISOString(),
    };
    saveDraft(snapshot);
    savePage(snapshot);
    dispatch({ type: 'MARK_DRAFT_SAVED' });
  }, []);

  const publish = useCallback(() => {
    const cur = stateRef.current;
    const snapshot: PageSnapshot = {
      id: cur.pageId,
      label: cur.pageLabel,
      elements: cur.elements,
      updatedAt: new Date().toISOString(),
      published: true,
    };
    savePage(snapshot);
    publishPage(snapshot);
    dispatch({ type: 'MARK_SAVED' });
  }, []);

  const toggleEditingMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_EDITING_MODE' });
  }, []);

  const selectedElement = state.selectedId
    ? findElement(state.elements, state.selectedId)
    : null;

  return (
    <EditorContext.Provider value={{
      state, dispatch,
      addElement, selectElement, selectedElement,
      save, saveDraftFn, publish, toggleEditingMode,
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export function useEditor(): EditorContextType {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside EditorProvider');
  return ctx;
}

// Re-export genId for use in components
export { genId };
