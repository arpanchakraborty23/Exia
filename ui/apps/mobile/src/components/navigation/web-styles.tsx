import { useEffect } from 'react';
import { Platform } from 'react-native';

const WEB_CUSTOM_CSS = `
  /* Refined web scrollbars for desktop browsers (Chrome, Edge, Safari, Firefox) */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.15);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.18);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(31, 213, 249, 0.45);
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.15);
  }

  /* Refined selection highlight matching Exia cyan */
  ::selection {
    background-color: rgba(31, 213, 249, 0.35);
    color: #ffffff;
  }

  /* Desktop typography and smoothness */
  html, body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
`;

/**
 * Injects desktop browser styles on web runtime:
 * - Refined dark/cyan scrollbars for webkit and firefox
 * - High-contrast text selection color
 * - Subpixel font smoothing for crisp desktop rendering
 */
export function WebStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const STYLE_ID = 'exia-web-custom-styles';
    if (!document.getElementById(STYLE_ID)) {
      const styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      styleEl.textContent = WEB_CUSTOM_CSS;
      document.head.appendChild(styleEl);
    }
  }, []);

  return null;
}
