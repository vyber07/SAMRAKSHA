// ─── Visual Editor — Core Types ──────────────────────────────────────────────

export type ElementType =
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'container'
  | 'section'
  | 'divider'
  | 'badge'
  | 'card';

export interface ElementStyle {
  // Position / layout
  position?: 'static' | 'relative' | 'absolute';
  left?: string;
  top?: string;
  width?: string;
  height?: string;
  minHeight?: string;
  // Spacing
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string;
  letterSpacing?: string;
  textDecoration?: string;
  // Visual
  backgroundColor?: string;
  background?: string;
  border?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  borderRadius?: string;
  boxShadow?: string;
  opacity?: string;
  // Flex / Layout
  display?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  flexWrap?: string;
  flex?: string;
  // Overflow
  overflow?: string;
  // Cursor
  cursor?: string;
  // Transition
  transition?: string;
  // Visibility
  visibility?: string;
}

export interface EditorElement {
  id: string;
  type: ElementType;
  content: string;           // text content or image URL
  children: EditorElement[];
  style: ElementStyle;
  attrs?: Record<string, string>; // extra HTML attrs (href, alt, src, etc.)
  locked?: boolean;
  hidden?: boolean;          // soft-hide without deleting
  label?: string;            // optional friendly label for layers panel
}

export interface PageSnapshot {
  id: string;            // page route, e.g. "dashboard"
  label: string;         // human label
  elements: EditorElement[];
  updatedAt: string;
  published?: boolean;
}

// ─── Version history entry ────────────────────────────────────────────────────
export type VersionEventType = 'draft_saved' | 'published' | 'reset' | 'auto_save';

export interface VersionEntry {
  id: string;
  pageId: string;
  eventType: VersionEventType;
  timestamp: string;
  label: string;           // human description
  snapshot: PageSnapshot;  // full snapshot at that point
}

export interface HistoryEntry {
  elements: EditorElement[];
}

export type DropTarget = { parentId: string | null; index: number } | null;
