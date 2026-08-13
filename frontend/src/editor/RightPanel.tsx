// ─── Visual Editor — Right Panel (Properties Inspector) ──────────────────────

import React, { useState } from 'react';
import {
  Settings, Type, Palette, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Trash2, Copy, Lock, Unlock,
  ChevronDown, ChevronRight, Maximize2, Image as ImageIcon, CornerUpLeft,
} from 'lucide-react';
import { useEditor } from './EditorContext';
import type { EditorElement } from './types';

// ─── Section component ────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ElementType; defaultOpen?: boolean }> = ({
  title, children, icon: Icon, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(168,202,255,0.08)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 14px', background: 'transparent', border: 'none',
          cursor: 'pointer', color: '#7a9cc8', fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}
      >
        {Icon && <Icon size={12} />}
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div style={{ padding: '0 12px 12px' }}>{children}</div>}
    </div>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: '10px', color: '#4a6a8a', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', marginTop: '8px' }}>
    {children}
  </div>
);

const TextInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%', padding: '6px 8px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)',
      color: '#e8f0fe', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace',
      outline: 'none',
    }}
    onFocus={e => { e.currentTarget.style.borderColor = '#A8CAFF'; }}
    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(168,202,255,0.15)'; }}
  />
);

const ColorInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  // Extract hex from value for the color picker
  const hexMatch = value.match(/#[0-9a-fA-F]{3,8}/);
  const hexVal = hexMatch ? hexMatch[0] : '#ffffff';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <input
        type="color"
        value={hexVal}
        onChange={e => onChange(e.target.value)}
        style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={label}
        style={{
          flex: 1, padding: '5px 7px', borderRadius: '5px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)',
          color: '#e8f0fe', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#A8CAFF'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(168,202,255,0.15)'; }}
      />
    </div>
  );
};

const Row2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>{children}</div>
);

const SelectInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%', padding: '6px 8px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)',
      color: '#e8f0fe', fontSize: '12px', outline: 'none',
    }}
  >
    {options.map(o => <option key={o.value} value={o.value} style={{ background: '#0d1b2e' }}>{o.label}</option>)}
  </select>
);

// ─── Alignment button group ───────────────────────────────────────────────────
const AlignGroup: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const aligns = [
    { val: 'left', Icon: AlignLeft },
    { val: 'center', Icon: AlignCenter },
    { val: 'right', Icon: AlignRight },
    { val: 'justify', Icon: AlignJustify },
  ];
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {aligns.map(({ val, Icon }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          title={val}
          style={{
            flex: 1, padding: '5px', borderRadius: '4px',
            background: value === val ? 'rgba(168,202,255,0.2)' : 'transparent',
            border: `1px solid ${value === val ? '#A8CAFF' : 'rgba(168,202,255,0.15)'}`,
            cursor: 'pointer', color: value === val ? '#A8CAFF' : '#7a9cc8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
};

// ─── Spacing box ─────────────────────────────────────────────────────────────
const SpacingBox: React.FC<{
  label: string;
  top: string; right: string; bottom: string; left: string;
  onTopChange: (v: string) => void;
  onRightChange: (v: string) => void;
  onBottomChange: (v: string) => void;
  onLeftChange: (v: string) => void;
}> = ({ label, top, right, bottom, left, onTopChange, onRightChange, onBottomChange, onLeftChange }) => (
  <div>
    <Label>{label}</Label>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', textAlign: 'center' }}>
      <div />
      <input type="text" value={top} onChange={e => onTopChange(e.target.value)} placeholder="T"
        style={{ padding: '4px', textAlign: 'center', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)', color: '#e8f0fe', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }} />
      <div />
      <input type="text" value={left} onChange={e => onLeftChange(e.target.value)} placeholder="L"
        style={{ padding: '4px', textAlign: 'center', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)', color: '#e8f0fe', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#4a6a8a', fontWeight: 700 }}>{label.slice(0, 3).toUpperCase()}</div>
      <input type="text" value={right} onChange={e => onRightChange(e.target.value)} placeholder="R"
        style={{ padding: '4px', textAlign: 'center', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)', color: '#e8f0fe', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }} />
      <div />
      <input type="text" value={bottom} onChange={e => onBottomChange(e.target.value)} placeholder="B"
        style={{ padding: '4px', textAlign: 'center', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)', color: '#e8f0fe', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }} />
      <div />
    </div>
  </div>
);

// ─── Main Right Panel ─────────────────────────────────────────────────────────
export const RightPanel: React.FC = () => {
  const { selectedElement, dispatch } = useEditor();

  if (!selectedElement) {
    return (
      <div style={{
        width: '260px', minWidth: '260px',
        background: 'rgba(6,13,26,0.97)',
        borderLeft: '1px solid rgba(168,202,255,0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px', gap: '8px',
      }}>
        <Settings size={32} color="rgba(168,202,255,0.2)" />
        <p style={{ fontSize: '12px', color: '#4a6a8a', textAlign: 'center', lineHeight: 1.5 }}>
          Click any element on the canvas to inspect and edit its properties.
        </p>
      </div>
    );
  }

  const el = selectedElement;
  const sty = el.style;

  const updateStyle = (style: Partial<EditorElement['style']>) => {
    dispatch({ type: 'UPDATE_STYLE', id: el.id, style });
  };

  const updateContent = (content: string) => {
    dispatch({ type: 'UPDATE_CONTENT', id: el.id, content });
  };

  const isText = ['text', 'heading', 'paragraph', 'button', 'badge'].includes(el.type);
  const isLayout = el.type === 'container' || el.type === 'section';
  const isImage = el.type === 'image';

  return (
    <div style={{
      width: '260px', minWidth: '260px',
      background: 'rgba(6,13,26,0.97)',
      borderLeft: '1px solid rgba(168,202,255,0.1)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 14px', borderBottom: '1px solid rgba(168,202,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Settings size={13} color="#A8CAFF" />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#7a9cc8', letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>
          {el.type} Properties
        </span>
        {/* Action buttons */}
        <button title="Duplicate" onClick={() => dispatch({ type: 'DUPLICATE_ELEMENT', id: el.id })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a9cc8', display: 'flex', padding: '2px' }}>
          <Copy size={13} />
        </button>
        <button title="Delete" onClick={() => dispatch({ type: 'DELETE_ELEMENT', id: el.id })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: '2px' }}>
          <Trash2 size={13} />
        </button>
      </div>

      {/* Content section */}
      {isText && (
        <Section title="Content" icon={AlignLeft}>
          <Label>Text Content</Label>
          <textarea
            value={el.content}
            onChange={e => updateContent(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,202,255,0.15)',
              color: '#e8f0fe', fontSize: '12px', resize: 'vertical', fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </Section>
      )}

      {isImage && (
        <Section title="Image" icon={ImageIcon}>
          <Label>Image URL / src</Label>
          <TextInput
            value={el.content}
            onChange={v => {
              updateContent(v);
              dispatch({ type: 'UPDATE_ATTRS', id: el.id, attrs: { src: v } });
            }}
            placeholder="https://..."
          />
          <Label>Alt text</Label>
          <TextInput
            value={el.attrs?.alt ?? ''}
            onChange={v => dispatch({ type: 'UPDATE_ATTRS', id: el.id, attrs: { alt: v } })}
            placeholder="Description"
          />
        </Section>
      )}

      {/* Typography */}
      {isText && (
        <Section title="Typography" icon={Type}>
          <Label>Font Family</Label>
          <SelectInput
            value={sty.fontFamily ?? ''}
            onChange={v => updateStyle({ fontFamily: v })}
            options={[
              { value: 'Plus Jakarta Sans, sans-serif', label: 'Plus Jakarta Sans' },
              { value: 'Montserrat, sans-serif', label: 'Montserrat' },
              { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono' },
              { value: 'Inter, sans-serif', label: 'Inter' },
              { value: 'Georgia, serif', label: 'Georgia' },
              { value: 'Arial, sans-serif', label: 'Arial' },
            ]}
          />

          <Row2>
            <div>
              <Label>Size</Label>
              <TextInput value={sty.fontSize ?? ''} onChange={v => updateStyle({ fontSize: v })} placeholder="14px" />
            </div>
            <div>
              <Label>Weight</Label>
              <SelectInput
                value={sty.fontWeight ?? '400'}
                onChange={v => updateStyle({ fontWeight: v })}
                options={[
                  { value: '300', label: 'Light' },
                  { value: '400', label: 'Regular' },
                  { value: '500', label: 'Medium' },
                  { value: '600', label: 'SemiBold' },
                  { value: '700', label: 'Bold' },
                  { value: '800', label: 'ExtraBold' },
                  { value: '900', label: 'Black' },
                ]}
              />
            </div>
          </Row2>

          <Row2>
            <div>
              <Label>Line Height</Label>
              <TextInput value={sty.lineHeight ?? ''} onChange={v => updateStyle({ lineHeight: v })} placeholder="1.5" />
            </div>
            <div>
              <Label>Letter Spacing</Label>
              <TextInput value={sty.letterSpacing ?? ''} onChange={v => updateStyle({ letterSpacing: v })} placeholder="0em" />
            </div>
          </Row2>

          <Label>Alignment</Label>
          <AlignGroup
            value={sty.textAlign ?? 'left'}
            onChange={v => updateStyle({ textAlign: v as EditorElement['style']['textAlign'] })}
          />

          <Label>Text Decoration</Label>
          <SelectInput
            value={sty.textDecoration ?? 'none'}
            onChange={v => updateStyle({ textDecoration: v })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'underline', label: 'Underline' },
              { value: 'line-through', label: 'Strikethrough' },
              { value: 'overline', label: 'Overline' },
            ]}
          />
        </Section>
      )}

      {/* Colors */}
      <Section title="Colors" icon={Palette}>
        {isText && (
          <>
            <Label>Text Color</Label>
            <ColorInput value={sty.color ?? '#e8f0fe'} onChange={v => updateStyle({ color: v })} label="Color" />
          </>
        )}
        <Label>Background Color</Label>
        <ColorInput
          value={sty.backgroundColor ?? sty.background ?? 'transparent'}
          onChange={v => updateStyle({ backgroundColor: v, background: undefined })}
          label="BG Color"
        />
        <Label>Background (gradient/advanced)</Label>
        <TextInput
          value={sty.background ?? ''}
          onChange={v => updateStyle({ background: v })}
          placeholder="linear-gradient(...) or rgba(...)"
        />
      </Section>

      {/* Size */}
      <Section title="Size" icon={Maximize2}>
        <Row2>
          <div>
            <Label>Width</Label>
            <TextInput value={sty.width ?? ''} onChange={v => updateStyle({ width: v })} placeholder="auto" />
          </div>
          <div>
            <Label>Height</Label>
            <TextInput value={sty.height ?? ''} onChange={v => updateStyle({ height: v })} placeholder="auto" />
          </div>
        </Row2>
        <Label>Min Height</Label>
        <TextInput value={sty.minHeight ?? ''} onChange={v => updateStyle({ minHeight: v })} placeholder="auto" />
        <Label>Opacity</Label>
        <input
          type="range" min={0} max={1} step={0.05}
          value={parseFloat(sty.opacity ?? '1')}
          onChange={e => updateStyle({ opacity: e.target.value })}
          style={{ width: '100%', accentColor: '#A8CAFF' }}
        />
        <div style={{ fontSize: '11px', color: '#7a9cc8', textAlign: 'right' }}>
          {Math.round(parseFloat(sty.opacity ?? '1') * 100)}%
        </div>
      </Section>

      {/* Spacing */}
      <Section title="Spacing" icon={CornerUpLeft}>
        <SpacingBox
          label="Margin"
          top={sty.marginTop ?? ''}
          right={sty.marginRight ?? ''}
          bottom={sty.marginBottom ?? ''}
          left={sty.marginLeft ?? ''}
          onTopChange={v => updateStyle({ marginTop: v })}
          onRightChange={v => updateStyle({ marginRight: v })}
          onBottomChange={v => updateStyle({ marginBottom: v })}
          onLeftChange={v => updateStyle({ marginLeft: v })}
        />
        <SpacingBox
          label="Padding"
          top={sty.paddingTop ?? ''}
          right={sty.paddingRight ?? ''}
          bottom={sty.paddingBottom ?? ''}
          left={sty.paddingLeft ?? ''}
          onTopChange={v => updateStyle({ paddingTop: v })}
          onRightChange={v => updateStyle({ paddingRight: v })}
          onBottomChange={v => updateStyle({ paddingBottom: v })}
          onLeftChange={v => updateStyle({ paddingLeft: v })}
        />
      </Section>

      {/* Border */}
      <Section title="Border" icon={Lock} defaultOpen={false}>
        <Label>Border</Label>
        <TextInput value={sty.border ?? ''} onChange={v => updateStyle({ border: v })} placeholder="1px solid #ccc" />
        <Label>Border Radius</Label>
        <TextInput value={sty.borderRadius ?? ''} onChange={v => updateStyle({ borderRadius: v })} placeholder="8px" />
      </Section>

      {/* Effects */}
      <Section title="Effects" icon={Unlock} defaultOpen={false}>
        <Label>Box Shadow</Label>
        <TextInput value={sty.boxShadow ?? ''} onChange={v => updateStyle({ boxShadow: v })} placeholder="0 4px 20px rgba(0,0,0,0.3)" />
        <Label>Transition</Label>
        <TextInput value={sty.transition ?? ''} onChange={v => updateStyle({ transition: v })} placeholder="all 0.2s ease" />
      </Section>

      {/* Layout (for containers) */}
      {isLayout && (
        <Section title="Layout" icon={Settings}>
          <Label>Display</Label>
          <SelectInput
            value={sty.display ?? 'flex'}
            onChange={v => updateStyle({ display: v })}
            options={[
              { value: 'flex', label: 'Flex' },
              { value: 'block', label: 'Block' },
              { value: 'grid', label: 'Grid' },
              { value: 'none', label: 'Hidden' },
            ]}
          />
          <Label>Direction</Label>
          <SelectInput
            value={sty.flexDirection ?? 'column'}
            onChange={v => updateStyle({ flexDirection: v })}
            options={[
              { value: 'column', label: 'Column' },
              { value: 'row', label: 'Row' },
              { value: 'row-reverse', label: 'Row Reverse' },
              { value: 'column-reverse', label: 'Column Reverse' },
            ]}
          />
          <Label>Align Items</Label>
          <SelectInput
            value={sty.alignItems ?? 'stretch'}
            onChange={v => updateStyle({ alignItems: v })}
            options={[
              { value: 'stretch', label: 'Stretch' },
              { value: 'flex-start', label: 'Start' },
              { value: 'center', label: 'Center' },
              { value: 'flex-end', label: 'End' },
            ]}
          />
          <Label>Justify Content</Label>
          <SelectInput
            value={sty.justifyContent ?? 'flex-start'}
            onChange={v => updateStyle({ justifyContent: v })}
            options={[
              { value: 'flex-start', label: 'Start' },
              { value: 'center', label: 'Center' },
              { value: 'flex-end', label: 'End' },
              { value: 'space-between', label: 'Space Between' },
              { value: 'space-around', label: 'Space Around' },
              { value: 'space-evenly', label: 'Space Evenly' },
            ]}
          />
          <Label>Gap</Label>
          <TextInput value={sty.gap ?? ''} onChange={v => updateStyle({ gap: v })} placeholder="16px" />
        </Section>
      )}

      {/* Raw CSS JSON – power user */}
      <Section title="Raw Styles (JSON)" icon={Settings} defaultOpen={false}>
        <Label>Paste JSON styles (will be merged)</Label>
        <textarea
          rows={5}
          placeholder='{"fontFamily": "Arial", "color": "#fff"}'
          style={{
            width: '100%', padding: '6px 8px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,202,255,0.12)',
            color: '#b8cef8', fontSize: '11px', resize: 'vertical',
            fontFamily: 'JetBrains Mono, monospace', outline: 'none',
          }}
          onBlur={e => {
            try {
              const parsed = JSON.parse(e.target.value) as Partial<EditorElement['style']>;
              updateStyle(parsed);
              e.target.value = '';
            } catch {
              // ignore
            }
          }}
        />
      </Section>

      <div style={{ height: '40px' }} />
    </div>
  );
};
