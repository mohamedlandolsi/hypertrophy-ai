'use client';

import { useEffect } from 'react';

const KEYBOARD_INSET_VAR = '--keyboard-inset';

export function useVirtualKeyboard() {
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handler = () => {
      // This is the robust calculation: Layout height minus visual height
      const keyboardInset = document.documentElement.clientHeight - visualViewport.height;

      // Set the CSS variable on the root element for layout adjustments
      document.documentElement.style.setProperty(
        KEYBOARD_INSET_VAR,
        `${keyboardInset}px`
      );
    };

    visualViewport.addEventListener('resize', handler);
    // Initial call to set the value on load
    handler();

    return () => {
      visualViewport.removeEventListener('resize', handler);
      document.documentElement.style.removeProperty(KEYBOARD_INSET_VAR);
    };
  }, []);
}
