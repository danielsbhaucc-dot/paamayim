import React from 'react';
import { useLayout } from '../ui/useLayout';
import { SideMenu } from './SideMenu';
import { WideMenu } from './WideMenu';

/**
 * מארח לתפריט.
 * טלפון: SideMenu המקורי, בלי שום שינוי.
 * טאבלט / דסקטופ (web ו-native): WideMenu — אותם פריטים, מסך מלא, גדול ומרווח.
 */
export function SideMenuHost() {
  const { isWide } = useLayout();
  return isWide ? <WideMenu /> : <SideMenu />;
}
