// ─── Visual Editor — Left Panel (Elements Palette) ────────────────────────────

import React, { useState } from 'react';
import {
  Type, AlignLeft, Square, Image, Layout, Columns,
  Minus, Tag, ChevronDown, ChevronRight, Layers,
  GripVertical,
} from 'lucide-react';
import type { ElementType } from './types';
import { useEditor } from './EditorContext';

interface PaletteItem {
  type: ElementType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const PALETTE_GROUPS: { group: string; items: PaletteItem[] }[] = [
  {
    group: 'Typography',
    items: [
      { type: 'heading', label: 'Heading', icon: Type, description: 'H1–H4 heading text' },
      { type: 'text', label: 'Text Block', icon: AlignLeft, description: 'General text span' },
      { type: 'paragraph', label: 'Paragraph', icon: AlignLeft, description: 'Body paragraph' },
    ],
  },
  {
    group: 'Interactive',
    items: [
      { type: 'button', label: 'Button', icon: Square, description: 'Clickable button' },
      { type: 'badge', label: 'Badge', icon: Tag, description: 'Status badge chip' },
    ],
  },
  {
    group: 'Media',
    items: [
      { type: 'image', label: 'Image', icon: Image, description: 'Image element' },
      { type: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal line' },
    ],
  },
  {
    group: 'Layout',
    items: [
      { type: 'container', label: 'Container', icon: Layout, description: 'Flex column box' },
      { type: 'section', label: 'Section', icon: Columns, description: 'Full-width section' },
    ],
  },
];

const s = {
  panel: {
    width: '220px',
    minWidth: '220px',
    background: 'rgba(6,13,26,0.97)',
    borderRight: '1px solid rgba(168,202,255,0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  header: {
    padding: '12px 14px',
    borderBottom: '1px solid rgba(168,202,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerText: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#7a9cc8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(168,202,255,0.1)',
  },
  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px',
    fontSize: '11px',
    fontWeight: 600,
    textAlign: 'center',
    color: active ? '#A8CAFF' : '#4a6a8a',
    borderBottom: active ? '2px solid #A8CAFF' : '2px solid transparent',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    letterSpacing: '0.05em',
  }),
  scroll: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 4px 4px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#4a6a8a',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  paletteItem: (dragging: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    marginBottom: '2px',
    cursor: 'grab',
    background: dragging ? 'rgba(168,202,255,0.1)' : 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(168,202,255,0.08)',
    transition: 'background 0.15s, border-color 0.15s',
    userSelect: 'none' as const,
  }),
};

// ─── Layer Tree item ──────────────────────────────────────────────────────────
import type { EditorElement } from './types';

const LayerItem: React.FC<{ element: EditorElement; depth: number }> = ({ element, depth }) => {
  const { state, selectElement } = useEditor();
  const [expanded, setExpanded] = useState(true);
  const isSelected = state.selectedId === element.id;
  const hasChildren = element.children.length > 0;

  return (
    <div>
      <div
        onClick={() => selectElement(element.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '5px 8px 5px ' + (8 + depth * 14) + 'px',
          borderRadius: '6px', cursor: 'pointer',
          background: isSelected ? 'rgba(168,202,255,0.12)' : 'transparent',
          color: isSelected ? '#A8CAFF' : '#b8cef8',
          fontSize: '12px', fontWeight: isSelected ? 600 : 400,
          marginBottom: '1px',
        }}
      >
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span style={{ width: 12 }} />
        )}
        <GripVertical size={11} style={{ color: '#4a6a8a', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          <span style={{ fontSize: '10px', color: '#4a6a8a', fontFamily: 'JetBrains Mono, monospace', marginRight: '4px' }}>
            {element.type}
          </span>
          {element.content ? element.content.slice(0, 20) : ''}
        </span>
      </div>
      {expanded && hasChildren && element.children.map(child => (
        <LayerItem key={child.id} element={child} depth={depth + 1} />
      ))}
    </div>
  );
};

// ─── Main Left Panel ──────────────────────────────────────────────────────────
export const LeftPanel: React.FC = () => {
  const { addElement, state } = useEditor();
  const [activeTab, setActiveTab] = useState<'elements' | 'layers'>('elements');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('newElementType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddClick = (type: ElementType) => {
    addElement(type, null);
  };

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <Layers size={14} color="#A8CAFF" />
        <span style={s.headerText}>Elements</span>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button style={s.tab(activeTab === 'elements')} onClick={() => setActiveTab('elements')}>
          Elements
        </button>
        <button style={s.tab(activeTab === 'layers')} onClick={() => setActiveTab('layers')}>
          Layers
        </button>
      </div>

      <div style={s.scroll}>
        {activeTab === 'elements' ? (
          <>
            <p style={{ fontSize: '11px', color: '#4a6a8a', padding: '6px 4px 10px', lineHeight: 1.4 }}>
              Click to add • Drag onto canvas to position
            </p>
            {PALETTE_GROUPS.map(group => {
              const isCollapsed = collapsed[group.group];
              return (
                <div key={group.group} style={{ marginBottom: '4px' }}>
                  <div
                    style={s.groupHeader}
                    onClick={() => setCollapsed(c => ({ ...c, [group.group]: !c[group.group] }))}
                  >
                    {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                    {group.group}
                  </div>
                  {!isCollapsed && group.items.map(item => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={e => handleDragStart(e, item.type)}
                      onClick={() => handleAddClick(item.type)}
                      style={s.paletteItem(false)}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(168,202,255,0.1)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,202,255,0.2)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,202,255,0.08)';
                      }}
                    >
                      <item.icon size={15} color="#A8CAFF" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8f0fe' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '10px', color: '#4a6a8a' }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ) : (
          /* Layers tab */
          <>
            {state.elements.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#4a6a8a', padding: '16px 4px', textAlign: 'center' }}>
                No elements yet. Add from the Elements tab.
              </p>
            ) : (
              state.elements.map(el => (
                <LayerItem key={el.id} element={el} depth={0} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
