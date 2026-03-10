'use client';

import { useEffect, useRef } from 'react';

export interface KeyboardShortcutHandlers {
  /** Space bar — toggle play / pause. */
  onPlayPause?: () => void;
  /** Right arrow — seek forward (typically 5 s). */
  onSeekForward?: () => void;
  /** Left arrow — seek backward (typically 5 s). */
  onSeekBack?: () => void;
  /** 'a' or '?' — open the ask / question overlay. */
  onAsk?: () => void;
  /** Escape — close overlays. */
  onEscape?: () => void;
}

/**
 * Registers global keyboard shortcuts for the video player.
 *
 * Key bindings:
 * | Key            | Action          |
 * |----------------|-----------------|
 * | Space          | Play / Pause    |
 * | ArrowRight     | Seek forward    |
 * | ArrowLeft      | Seek backward   |
 * | `a` / `?`      | Open ask overlay|
 * | Escape         | Close overlays  |
 *
 * Shortcuts are **not** fired when the active element is an input, textarea,
 * select, or any element with `contentEditable` to avoid interfering with
 * text entry.
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  // Store handlers in a ref so the effect closure always has access to the
  // latest callbacks without needing to re-attach the listener on every render.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Ignore key events when focus is inside a form control or editable area.
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const h = handlersRef.current;

      switch (event.key) {
        case ' ':
          event.preventDefault(); // Prevent page scroll
          h.onPlayPause?.();
          break;

        case 'ArrowRight':
          event.preventDefault();
          h.onSeekForward?.();
          break;

        case 'ArrowLeft':
          event.preventDefault();
          h.onSeekBack?.();
          break;

        case 'a':
        case '?':
          // '?' requires Shift on US keyboards — we match the character, not
          // the physical key, so it works regardless of layout.
          h.onAsk?.();
          break;

        case 'Escape':
          h.onEscape?.();
          break;

        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
