/**
 * 用户等级 / 会员 ID 限制（与折扣 user_restrictions、团购 restrictions 共用规则）
 * - user_level_restriction：按 membership.level；level 为空视为无等级
 * - membership_restriction：按用户 User.id（逗号分隔）
 * - allow 与 interdict 同时存在时，仅使用 allow，忽略 interdict
 */

import type { Discount, GroupBuyingActivity, CrowdfundingActivity } from './product';

export interface DiscountViewerContext {
  userId: string | null;
  level: string | null;
}

export const GUEST_DISCOUNT_VIEWER: DiscountViewerContext = {
  userId: null,
  level: null,
};

function parseCsv(val: unknown): string[] {
  if (val === undefined || val === null) {
    return [];
  }
  const s = String(val).trim();
  if (!s) {
    return [];
  }
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

/**
 * @param value 当前用户的 level 或 userId；无则为 null
 */
function restrictionAllows(
  restriction: { allow?: unknown; interdict?: unknown } | null | undefined,
  value: string | null
): boolean {
  if (!restriction || typeof restriction !== 'object') {
    return true;
  }
  const allowRaw =
    restriction.allow !== undefined && restriction.allow !== null
      ? String(restriction.allow).trim()
      : '';
  const interdictRaw =
    restriction.interdict !== undefined && restriction.interdict !== null
      ? String(restriction.interdict).trim()
      : '';

  if (allowRaw) {
    const allowed = parseCsv(allowRaw);
    if (value === null || value === '') {
      return false;
    }
    return allowed.some((a) => a === value);
  }

  if (interdictRaw) {
    const forbidden = parseCsv(interdictRaw);
    if (value === null || value === '') {
      return true;
    }
    return !forbidden.some((f) => f === value);
  }

  return true;
}

/** 任意含 user_level_restriction / membership_restriction 的对象（折扣、团购等） */
export type UserRestrictionFields = {
  user_level_restriction?: { allow?: unknown; interdict?: unknown } | null;
  membership_restriction?: { allow?: unknown; interdict?: unknown } | null;
} | null | undefined;

/**
 * 是否满足「等级 + 用户 ID」限制（两段均配置时需同时满足）
 */
export function matchesUserRestrictionsFields(
  viewer: DiscountViewerContext | null | undefined,
  block: UserRestrictionFields
): boolean {
  const v = viewer ?? GUEST_DISCOUNT_VIEWER;
  if (!block || typeof block !== 'object') {
    return true;
  }

  const ul = block.user_level_restriction as
    | { allow?: unknown; interdict?: unknown }
    | undefined;
  const mr = block.membership_restriction as
    | { allow?: unknown; interdict?: unknown }
    | undefined;

  if (!restrictionAllows(ul, v.level)) {
    return false;
  }
  if (!restrictionAllows(mr, v.userId)) {
    return false;
  }
  return true;
}

export function matchesDiscountUserRestrictions(
  discount: Discount,
  viewer: DiscountViewerContext | null | undefined
): boolean {
  return matchesUserRestrictionsFields(viewer, discount.user_restrictions);
}

/** 团购 activity.restrictions 中的等级与会员限制，折扣 user_restrictions 同源规则 */
export function matchesGroupBuyingUserRestrictions(
  activity: GroupBuyingActivity,
  viewer: DiscountViewerContext | null | undefined
): boolean {
  const r = activity.restrictions;
  if (!r || typeof r !== 'object') {
    return true;
  }
  return matchesUserRestrictionsFields(viewer, {
    user_level_restriction: r.user_level_restriction,
    membership_restriction: r.membership_restriction,
  });
}

/** 众筹 activity.restrictions 中的等级与会员限制（与团购同源规则） */
export function matchesCrowdfundingUserRestrictions(
  activity: CrowdfundingActivity,
  viewer: DiscountViewerContext | null | undefined
): boolean {
  const r = activity.restrictions;
  if (!r || typeof r !== 'object') {
    return true;
  }
  return matchesUserRestrictionsFields(viewer, {
    user_level_restriction: r.user_level_restriction,
    membership_restriction: r.membership_restriction,
  });
}
