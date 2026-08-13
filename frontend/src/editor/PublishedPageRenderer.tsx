// ─── PublishedPageRenderer ────────────────────────────────────────────────────
// Renders a published PageSnapshot purely for display — no selection outlines,
// no drag handles, no label chips, no editing UI.
//
// Uses the same CSS-style data as RenderedElement but with all editor
// interactions stripped out (equivalent to RenderedElement in previewMode=true).

import React from 'react';
import type { EditorElement, PageSnapshot } from './types';

// ─── Single element renderer (no editor chrome) ────────────────────────────

interface ElementProps {
  element: EditorElement;
}

const PureElement: React.FC<ElementProps> = ({ element }) => {
  const css = element.style as React.CSSProperties;

  if (element.type === 'image') {
    return (
      <img
        src={element.content || element.attrs?.src || ''}
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

  if (element.type === 'container' || element.type === 'section') {
    return (
      <div style={css}>
        {element.children.map(child => (
          <PureElement key={child.id} element={child} />
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
  return React.createElement(Tag, { style: css }, element.content);
};

// ─── Page renderer ─────────────────────────────────────────────────────────

interface PublishedPageRendererProps {
  snapshot: PageSnapshot;
}

/**
 * Renders a published PageSnapshot as plain HTML with no editor controls.
 * Wrap this in the same container/padding your page normally uses if needed,
 * or use it as a full-page replacement.
 */
export const PublishedPageRenderer: React.FC<PublishedPageRendererProps> = ({
  snapshot,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        background: 'var(--bg-primary, #060d1a)',
        color: 'var(--text-primary, #e8f0fe)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {snapshot.elements.map(el => (
        <PureElement key={el.id} element={el} />
      ))}
    </div>
  );
};
