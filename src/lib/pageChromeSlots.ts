import type { PageComponentSlot } from './pageComponents';
import { resolveChromeShellKind } from './chromeComponentCode';

export function isPageHeaderChromeSlot(slot: PageComponentSlot): boolean {
  return resolveChromeShellKind(slot.normalizedCode, slot.componentType) === 'header';
}

export function isPageFooterChromeSlot(slot: PageComponentSlot): boolean {
  return resolveChromeShellKind(slot.normalizedCode, slot.componentType) === 'footer';
}
