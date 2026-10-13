"use client";

import * as React from "react";

// Shared by modal panels and native details popovers. Descendants win even
// when React mounts child effects before the parent's effect.
const layers: { element: HTMLElement; modal: boolean }[] = [];

export function useDismissLayer(open: boolean, ref: React.RefObject<HTMLElement | null>, modal = false) {
  const registered = modal ? open : true;
  React.useEffect(() => {
    const element = ref.current;
    if (!registered || !element) return;
    const layer = { element, modal };
    layers.push(layer);
    return () => {
      const index = layers.indexOf(layer);
      if (index >= 0) layers.splice(index, 1);
    };
  }, [registered, ref, modal]);

  return React.useCallback((modalOnly = false) => {
    const top = layers.reduce<HTMLElement | null>((current, layer) => {
      const { element } = layer;
      if (!element.isConnected || (modalOnly && !layer.modal)) return current;
      // Native details.open changes synchronously; its toggle event may arrive
      // after the next key press, before React has updated the open state.
      if (element instanceof HTMLDetailsElement && !element.open) return current;
      if (!current || current.contains(element)) return element;
      if (element.contains(current)) return current;
      const focused = document.activeElement;
      if (focused && element.contains(focused)) return element;
      if (focused && current.contains(focused)) return current;
      return element;
    }, null);
    return top === ref.current;
  }, [ref]);
}
