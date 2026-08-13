// ─── Mobile Bottom Bar — Visual Editor ────────────────────────────────────────
// Minimal toolbar shown on mobile viewports instead of the left/right panels.

import React from 'react';
import { Layers, Eye, Plus } from 'lucide-react';
import { useEditor } from './EditorContext';

export const MobileBottomBar: React.FC = () => {
  const { state, dispatch, addElement } = useEditor();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '56px',
        background: '#0d1b2e',
        borderTop: '1px solid rgba(168,202,255,0.12)',
        paddingLeft: '8px',
        paddingRight: '8px',
        flexShrink: 0,
      }}
    >
      {/* Add element */}
      <button
        onClick={() => addElement('text')}
        title="Add text"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#A8CAFF', fontSize: '10px', fontWeight: 600,
        }}
      >
        <Plus size={20} />
        Add
      </button>

      {/* Layers toggle */}
      <button
        onClick={() => dispatch({ type: 'SELECT', id: null })}
        title="Layers"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#A8CAFF', fontSize: '10px', fontWeight: 600,
        }}
      >
        <Layers size={20} />
        Layers
      </button>

      {/* Preview toggle */}
      <button
        onClick={() => dispatch({ type: 'SET_PREVIEW', on: !state.previewMode })}
        title="Preview"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: state.previewMode ? '#60C8FF' : '#A8CAFF',
          fontSize: '10px', fontWeight: 600,
        }}
      >
        <Eye size={20} />
        Preview
      </button>
    </div>
  );
};
