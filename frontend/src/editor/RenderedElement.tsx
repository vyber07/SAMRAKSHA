// ─── Visual Editor — Canvas Element Renderer ─────────────────────────────────

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { EditorElement } from './types';
import { useEditor } from './EditorContext';

interface RenderedElementProps {
  element: EditorElement;
  depth?: number;
}

/** Convert ElementStyle to React.CSSProperties (they're compatible by design) */
function toCSS(style: EditorElement['style']): React.CSSProperties {
  return style as React.CSSProperties;
}

/** Inline text editor component */
const InlineTextEditor: React.FC<{
  content: string;
  onCommit: (val: string) => void;
  onCancel: () => void;
  style?: React.CSSProperties;
  tag?: React.ElementType;
}> = ({ content, onCommit, onCancel, style, tag = 'div' }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = content;
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      ref.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return React.createElement(tag as string, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    style: {
      ...style,
      outline: '2px solid #A8CAFF',
      outlineOffset: '2px',
      cursor: 'text',
      minWidth: '20px',
      minHeight: '1em',
      borderRadius: '3px',
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      onCommit(e.currentTarget.textContent ?? '');
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        e.currentTarget.blur();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onCommit(e.currentTarget.textContent ?? '');
        e.currentTarget.blur();
      }
    },
  });
};

/** Move up/down controls for root-level elements */
const MoveControls: React.FC<{
  elementId: string;
  isFirst: boolean;
  isLast: boolean;
}> = ({ elementId, isFirst, isLast }) => {
  const { dispatch } = useEditor();
  return (
    <div style={{
      position: 'absolute', right: '-36px', top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: '2px',
      zIndex: 9999,
    }}>
      <button
        disabled={isFirst}
        onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_UP', id: elementId }); }}
        style={{
          width: '24px', height: '20px', padding: 0,
          background: isFirst ? 'rgba(168,202,255,0.04)' : 'rgba(168,202,255,0.12)',
          border: '1px solid rgba(168,202,255,0.2)', borderRadius: '4px',
          cursor: isFirst ? 'not-allowed' : 'pointer',
          color: isFirst ? 'rgba(168,202,255,0.25)' : '#A8CAFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px',
        }}
        title="Move Up"
      >▲</button>
      <button
        disabled={isLast}
        onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_DOWN', id: elementId }); }}
        style={{
          width: '24px', height: '20px', padding: 0,
          background: isLast ? 'rgba(168,202,255,0.04)' : 'rgba(168,202,255,0.12)',
          border: '1px solid rgba(168,202,255,0.2)', borderRadius: '4px',
          cursor: isLast ? 'not-allowed' : 'pointer',
          color: isLast ? 'rgba(168,202,255,0.25)' : '#A8CAFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px',
        }}
        title="Move Down"
      >▼</button>
    </div>
  );
};

/** The rendered element with selection/hover chrome */
export const RenderedElement: React.FC<RenderedElementProps & { index?: number; totalSiblings?: number }> = ({
  element,
  depth = 0,
  index,
  totalSiblings,
}) => {
  const { state, dispatch, selectElement } = useEditor();
  const isSelected = state.selectedId === element.id;
  const isHovered = state.hoveredId === element.id;
  const isPreview = state.previewMode;
  const [isInlineEditing, setIsInlineEditing] = useState(false);

  // Skip hidden elements
  if (element.hidden) return null;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!state.editingMode || isPreview) return;
    e.stopPropagation();
    selectElement(element.id);
  }, [state.editingMode, isPreview, selectElement, element.id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!state.editingMode || isPreview) return;
    e.stopPropagation();
    const isTextType = element.type !== 'container' && element.type !== 'section'
      && element.type !== 'card' && element.type !== 'image' && element.type !== 'divider';
    if (isTextType) {
      setIsInlineEditing(true);
    }
  }, [state.editingMode, isPreview, element.type]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!state.editingMode || isPreview) return;
    e.stopPropagation();
    dispatch({ type: 'HOVER', id: element.id });
  }, [state.editingMode, isPreview, dispatch, element.id]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    if (!state.editingMode || isPreview) return;
    e.stopPropagation();
    dispatch({ type: 'HOVER', id: null });
  }, [state.editingMode, isPreview, dispatch]);

  const commitContent = useCallback((val: string) => {
    dispatch({ type: 'UPDATE_CONTENT', id: element.id, content: val });
    setIsInlineEditing(false);
  }, [dispatch, element.id]);

  const cancelInlineEdit = useCallback(() => {
    setIsInlineEditing(false);
  }, []);

  // ── Drag state ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!state.editingMode || isPreview) return;
    e.stopPropagation();
    e.dataTransfer.setData('elementId', element.id);
    e.dataTransfer.effectAllowed = 'move';
  }, [state.editingMode, isPreview, element.id]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!state.editingMode || isPreview) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, [state.editingMode, isPreview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!state.editingMode || isPreview) return;
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('elementId');
    if (!draggedId || draggedId === element.id) return;
    if (element.type === 'container' || element.type === 'section' || element.type === 'card') {
      dispatch({ type: 'MOVE_ELEMENT', id: draggedId, parentId: element.id, index: element.children.length });
    }
  }, [state.editingMode, isPreview, element.id, element.type, element.children.length, dispatch]);

  // ── Selection outline ─────────────────────────────────────────────────────
  const showChrome = state.editingMode && !isPreview;
  const outlineStyle: React.CSSProperties = showChrome ? {
    outline: isSelected
      ? '2px solid #A8CAFF'
      : isHovered
        ? '1px dashed rgba(168,202,255,0.4)'
        : '1px solid transparent',
    outlineOffset: '1px',
    position: 'relative',
    transition: 'outline 0.1s',
  } : {};

  const wrapperStyle: React.CSSProperties = {
    ...outlineStyle,
    ...(showChrome && { cursor: isInlineEditing ? 'text' : 'default' }),
    // Hovering hint
    ...(showChrome && isHovered && !isSelected && {
      boxShadow: '0 0 0 1px rgba(168,202,255,0.08)',
    }),
  };

  // ── Label chip when selected ──────────────────────────────────────────────
  const labelChip = (showChrome && isSelected) ? (
    <div style={{
      position: 'absolute', top: '-22px', left: '0',
      background: '#A8CAFF', color: '#060d1a',
      fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
      padding: '2px 8px', borderRadius: '4px 4px 0 0',
      zIndex: 9999, whiteSpace: 'nowrap', pointerEvents: 'none',
      letterSpacing: '0.05em',
    }}>
      {element.label ? element.label.toUpperCase() : element.type.toUpperCase()}
    </div>
  ) : null;

  // ── Hover pencil indicator ────────────────────────────────────────────────
  const hoverIndicator = (showChrome && isHovered && !isSelected) ? (
    <div style={{
      position: 'absolute', top: '2px', right: '4px',
      background: 'rgba(168,202,255,0.9)', color: '#060d1a',
      fontSize: '9px', fontWeight: 700,
      padding: '2px 6px', borderRadius: '4px',
      zIndex: 9999, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', gap: '3px',
    }}>
      ✏️ click to edit
    </div>
  ) : null;

  const css = toCSS(element.style);

  // ── Render by type ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (element.type === 'image') {
      return (
        <img
          src={element.content || (element.attrs?.src ?? '')}
          alt={element.attrs?.alt ?? ''}
          style={{
            width: css.width ?? '100%',
            height: css.height ?? '200px',
            objectFit: 'cover',
            borderRadius: css.borderRadius,
            display: 'block',
          }}
          draggable={false}
        />
      );
    }

    if (element.type === 'divider') {
      return <hr style={{ border: 'none', height: '1px', ...css }} />;
    }

    if (element.type === 'container' || element.type === 'section' || element.type === 'card') {
      return (
        <div
          style={css}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {element.children.length === 0 && showChrome && (
            <div style={{
              color: 'rgba(168,202,255,0.3)', fontSize: '12px',
              textAlign: 'center', padding: '20px',
              border: '1px dashed rgba(168,202,255,0.2)', borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              Drop elements here
            </div>
          )}
          {element.children.map((child, idx) => (
            <RenderedElement
              key={child.id}
              element={child}
              depth={depth + 1}
              index={idx}
              totalSiblings={element.children.length}
            />
          ))}
        </div>
      );
    }

    // Text-based elements
    const tagMap: Record<string, string> = {
      heading: 'h2',
      paragraph: 'p',
      button: 'button',
      badge: 'span',
      text: 'div',
    };
    const Tag = tagMap[element.type] ?? 'div';

    if (isInlineEditing) {
      return (
        <InlineTextEditor
          content={element.content}
          onCommit={commitContent}
          onCancel={cancelInlineEdit}
          style={css}
          tag={Tag as React.ElementType}
        />
      );
    }

    return React.createElement(
      Tag,
      { style: css },
      element.content
    );
  };

  const isRootLevel = depth === 0;

  return (
    <div
      draggable={showChrome}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      style={wrapperStyle}
      data-element-id={element.id}
    >
      {labelChip}
      {hoverIndicator}
      {renderContent()}
      {/* Move up/down controls for root-level selected elements */}
      {showChrome && isSelected && isRootLevel && (
        <MoveControls
          elementId={element.id}
          isFirst={index === 0}
          isLast={index !== undefined && totalSiblings !== undefined && index === totalSiblings - 1}
        />
      )}
    </div>
  );
};
