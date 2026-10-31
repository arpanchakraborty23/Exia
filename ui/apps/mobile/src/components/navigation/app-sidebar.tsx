import React from 'react';

import { isElectronApp } from '@/lib/platform';
import { DesktopSidebar, DesktopSidebarProps } from './desktop-sidebar';
import { WebSidebar, WebSidebarProps } from './web-sidebar';

export type AppSidebarProps = DesktopSidebarProps & WebSidebarProps;

/**
 * Universal App Sidebar Dispatcher.
 * Dynamically provides the platform-tailored sidebar:
 * - Desktop Electron App: Native hardware controls, Setup Wizard, Local/Cloud switch.
 * - Web Browser App: Cloud Studio, Web Voice, Desktop download links, Web indicators.
 */
export function AppSidebar(props: AppSidebarProps) {
  const isDesktopElectron = isElectronApp();

  if (isDesktopElectron) {
    return <DesktopSidebar {...props} />;
  }

  return <WebSidebar {...props} />;
}
