import { useEffect } from 'react';

export interface ShortcutBinding {
  id: string;
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  allowInInput?: boolean;
  description: string;
  category: 'chat' | 'navigation' | 'tools';
  displayKeys: string[];
  handler: () => void;
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;

      const inEditable = isEditableElement(e.target);

      for (const binding of bindings) {
        if (inEditable && !binding.allowInInput) {
          continue;
        }

        const keyMatches = e.key.toLowerCase() === binding.key.toLowerCase();
        if (!keyMatches) continue;

        const ctrlMetaPressed = e.ctrlKey || e.metaKey;
        if (Boolean(binding.ctrlOrMeta) !== ctrlMetaPressed) continue;
        if (Boolean(binding.shift) !== e.shiftKey) continue;
        if (Boolean(binding.alt) !== e.altKey) continue;

        e.preventDefault();
        e.stopPropagation();
        binding.handler();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [bindings, enabled]);
}
