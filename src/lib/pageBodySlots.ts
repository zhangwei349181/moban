/**
 * 页面 body 槽位过滤（chrome 嵌套块、shell、layout 不进正文）
 */

import type { PageComponentSlot } from './pageComponents';
import {
  isChromeComponentType,
  isExcludedFromPageBodyCode,
  isFooterComponentType,
  isHeaderComponentType,
} from './chromeComponentCode';
import { isLayoutComponentType, isLayoutSectionCode } from './layoutComponentCode';
import {
  isDashboardPanelComponentType,
  isDashboardPanelSectionCode,
} from './dashboardComponentCode';

export function isFilteredFromPageBodyCode(code: string): boolean {
  return (
    isExcludedFromPageBodyCode(code) ||
    isLayoutSectionCode(code) ||
    isDashboardPanelSectionCode(code)
  );
}

export function filterPageBodySlots(slots: PageComponentSlot[]): PageComponentSlot[] {
  return slots.filter((slot) => {
    const byType =
      isLayoutComponentType(slot.componentType) ||
      isHeaderComponentType(slot.componentType) ||
      isFooterComponentType(slot.componentType) ||
      isChromeComponentType(slot.componentType) ||
      isDashboardPanelComponentType(slot.componentType);
    if (byType || isFilteredFromPageBodyCode(slot.normalizedCode)) {
      if (
        import.meta.env.DEV &&
        (isChromeComponentType(slot.componentType) ||
          isExcludedFromPageBodyCode(slot.normalizedCode) ||
          isDashboardPanelComponentType(slot.componentType) ||
          isDashboardPanelSectionCode(slot.normalizedCode))
      ) {
        const nestHint = isDashboardPanelComponentType(slot.componentType) ||
          isDashboardPanelSectionCode(slot.normalizedCode)
          ? 'dashboard shell'
          : 'header/footer shell';
        console.warn(
          `[pageBody] ignored nested component in body: ${slot.componentsCode} (nest with {{${slot.normalizedCode}}} in the ${nestHint})`
        );
      }
      return false;
    }
    return true;
  });
}
