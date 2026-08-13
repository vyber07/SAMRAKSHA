// ─── Visual Editor — Element Tree Utilities ───────────────────────────────────

import type { EditorElement } from './types';
import { genId } from './storage';

/** Find an element by id anywhere in the tree */
export function findElement(
  elements: EditorElement[],
  id: string
): EditorElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    const found = findElement(el.children, id);
    if (found) return found;
  }
  return null;
}

/** Immutably update an element by id */
export function updateElement(
  elements: EditorElement[],
  id: string,
  updater: (el: EditorElement) => EditorElement
): EditorElement[] {
  return elements.map(el => {
    if (el.id === id) return updater(el);
    return { ...el, children: updateElement(el.children, id, updater) };
  });
}

/** Remove an element by id, returns [newTree, removed] */
export function removeElement(
  elements: EditorElement[],
  id: string
): [EditorElement[], EditorElement | null] {
  let removed: EditorElement | null = null;
  const filtered = elements.reduce<EditorElement[]>((acc, el) => {
    if (el.id === id) {
      removed = el;
      return acc;
    }
    const [newChildren, r] = removeElement(el.children, id);
    if (r) removed = r;
    return [...acc, { ...el, children: newChildren }];
  }, []);
  return [filtered, removed];
}

/** Insert an element at a specific index in root or in a parent */
export function insertElement(
  elements: EditorElement[],
  element: EditorElement,
  parentId: string | null,
  index: number
): EditorElement[] {
  if (parentId === null) {
    const arr = [...elements];
    arr.splice(index, 0, element);
    return arr;
  }
  return elements.map(el => {
    if (el.id === parentId) {
      const children = [...el.children];
      children.splice(index, 0, element);
      return { ...el, children };
    }
    return { ...el, children: insertElement(el.children, element, parentId, index) };
  });
}

/** Move an element from one place to another */
export function moveElement(
  elements: EditorElement[],
  elementId: string,
  targetParentId: string | null,
  targetIndex: number
): EditorElement[] {
  const [withoutEl, removed] = removeElement(elements, elementId);
  if (!removed) return elements;
  return insertElement(withoutEl, removed, targetParentId, targetIndex);
}

/** Duplicate element (deep copy with new IDs) */
export function duplicateElement(el: EditorElement): EditorElement {
  const newEl: EditorElement = {
    ...JSON.parse(JSON.stringify(el)) as EditorElement,
    id: genId(),
  };
  newEl.children = newEl.children.map(c => duplicateElement(c));
  return newEl;
}

/** Get all element IDs in document order (for keyboard nav) */
export function getAllIds(elements: EditorElement[]): string[] {
  return elements.flatMap(el => [el.id, ...getAllIds(el.children)]);
}

/** Check if a targetId is a descendant of ancestorId */
export function isDescendant(
  elements: EditorElement[],
  ancestorId: string,
  targetId: string
): boolean {
  const ancestor = findElement(elements, ancestorId);
  if (!ancestor) return false;
  return findElement(ancestor.children, targetId) !== null;
}
