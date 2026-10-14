"use client";

import { useEffect } from "react";

const dirtyEditors = new Set<symbol>();
const LEAVE_MESSAGE = "Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?";
let acceptedNavigation = false;

function beforeUnload(event: BeforeUnloadEvent) {
  if (dirtyEditors.size === 0 || acceptedNavigation) return;
  event.preventDefault();
  event.returnValue = "";
}

function confirmNavigation(event: MouseEvent) {
  if (dirtyEditors.size === 0 || event.defaultPrevented || event.button !== 0
    || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download")
    || (anchor.target !== "" && anchor.target !== "_self")) return;
  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin
    || (destination.pathname === window.location.pathname && destination.search === window.location.search)
    || /\/export(?:\/|$)/.test(destination.pathname)) return;

  // Capture before NextLink and the document-level loading indicator. Cancelling
  // must leave the current editor, its inputs, and its loading state untouched.
  // Synchronous navigation interception must decide before the event continues.
  // eslint-disable-next-line no-restricted-syntax -- Opt-in loss-of-draft guard, paired with native beforeunload.
  if (!window.confirm(LEAVE_MESSAGE)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  } else {
    // A native link can unload in this same navigation turn. It was already
    // confirmed; client-side links must not leave a persistent unload bypass.
    acceptedNavigation = true;
    window.setTimeout(() => { acceptedNavigation = false; }, 0);
  }
}

/** Opt-in only: no history patching, no form submission or programmatic routing. */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const editor = Symbol("unsaved-editor");
    dirtyEditors.add(editor);
    if (dirtyEditors.size === 1) {
      window.addEventListener("beforeunload", beforeUnload);
      window.addEventListener("click", confirmNavigation, true);
    }
    return () => {
      dirtyEditors.delete(editor);
      if (dirtyEditors.size === 0) {
        acceptedNavigation = false;
        window.removeEventListener("beforeunload", beforeUnload);
        window.removeEventListener("click", confirmNavigation, true);
      }
    };
  }, [dirty]);
}
