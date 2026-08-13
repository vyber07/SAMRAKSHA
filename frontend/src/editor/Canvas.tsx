// ─── Visual Editor — Canvas ───────────────────────────────────────────────────

import React, { useCallback, useRef } from 'react';
import { useEditor } from './EditorContext';
import { RenderedElement } from './RenderedElement';
import { makeElementByType } from './storage';
import type { ElementType } from './types';
import { Pencil } from 'lucide-react';

const CANVAS_WIDTHS: Record<string, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export const Canvas: React.FC = () => {
  const { state, dispatch, selectElement, toggleEditingMode } = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);

  const previewWidth = CANVAS_WIDTHS[state.previewWidth] ?? '100%';
  const isEditing = state.editingMode && !state.previewMode;

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
    }
  }, [selectElement]);

  // Handle drops from the element palette (new element)
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    const newType = e.dataTransfer.getData('newElementType') as ElementType | '';
    if (newType) {
      const el = makeElementByType(newType);
      dispatch({ type: 'ADD_ELEMENT', element: el, parentId: null, index: state.elements.length });
      return;
    }
    // Handle reorder of existing element to root
    const draggedId = e.dataTransfer.getData('elementId');
    if (draggedId) {
      dispatch({ type: 'MOVE_ELEMENT', id: draggedId, parentId: null, index: state.elements.length });
    }
  }, [dispatch, state.elements.length, isEditing]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.getData('newElementType') ? 'copy' : 'move';
  }, [isEditing]);

  const isEmpty = state.elements.length === 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        background: state.previewMode
          ? 'var(--bg-primary, #060d1a)'
          : 'rgba(6,13,26,0.6)',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Responsive width wrapper */}
      <div
        style={{
          width: previewWidth,
          maxWidth: '100%',
          minHeight: '100%',
          transition: 'width 0.3s ease',
          boxShadow: state.previewWidth !== 'desktop'
            ? '0 0 0 1px rgba(168,202,255,0.15), 0 4px 40px rgba(0,0,0,0.5)'
            : 'none',
          background: 'var(--bg-primary, #060d1a)',
        }}
      >
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            minHeight: '100vh',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            // Subtle editing mode indicator on canvas border
            outline: isEditing ? '2px dashed rgba(168,202,255,0.1)' : 'none',
            outlineOffset: '-2px',
          }}
        >
          {/* Empty state */}
          {isEmpty && !state.previewMode && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '16px', pointerEvents: 'none',
            }}>
              <div style={{
                border: '2px dashed rgba(168,202,255,0.15)',
                borderRadius: '16px',
                padding: '60px 80px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '40px' }}>🎨</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(168,202,255,0.5)', fontFamily: 'Montserrat, sans-serif' }}>
                  Your canvas is empty
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(168,202,255,0.3)', maxWidth: '280px', lineHeight: 1.6 }}>
                  {isEditing
                    ? 'Click an element in the left panel to add it here, or drag elements directly onto this canvas.'
                    : 'Click "Edit Page" in the toolbar to enter editing mode and start modifying content.'}
                </div>
              </div>
            </div>
          )}

          {/* Render elements */}
          {state.elements.map(el => (
            <RenderedElement key={el.id} element={el} />
          ))}
        </div>
      </div>

      {/* Preview width indicator */}
      {state.previewWidth !== 'desktop' && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(6,13,26,0.9)', border: '1px solid rgba(168,202,255,0.15)',
          borderRadius: '20px', padding: '4px 14px',
          fontSize: '11px', color: '#7a9cc8', fontFamily: 'JetBrains Mono, monospace',
          pointerEvents: 'none',
        }}>
          {previewWidth} view
        </div>
      )}

      {/* Editing mode prompt overlay (shown when NOT in editing mode and not in preview) */}
      {!isEditing && !state.previewMode && state.elements.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '16px', right: '16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px',
          background: 'rgba(4,10,22,0.92)',
          border: '1px solid rgba(168,202,255,0.2)',
          borderRadius: '24px',
          fontSize: '12px', color: '#A8CAFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          cursor: 'pointer',
          zIndex: 10,
        }}
          onClick={toggleEditingMode}
        >
          <Pencil size={14} />
          <span>Click "Edit Page" to start editing</span>
        </div>
      )}
    </div>
  );
};
