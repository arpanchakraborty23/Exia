import React from 'react';

import { isElectronApp } from '@/lib/platform';
import { DesktopTopBar } from './desktop-top-bar';
import { WebTopBar } from './web-top-bar';

/**
 * Universal App Top Bar Dispatcher.
 * Automatically switches between:
 * - DesktopTopBar (for Electron Pro Studio layout with hardware audio status & local daemon switch)
 * - WebTopBar (for Web browser layout with cloud status & desktop download links)
 */
export function AppTopBar() {
  const isDesktop = isElectronApp();

  if (isDesktop) {
    return <DesktopTopBar />;
  }

  return <WebTopBar />;
}
