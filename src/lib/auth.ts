/**
 * 认证相关的工具函数
 * 用于处理用户登录、注册、登出等认证相关操作
 */

import { APP_CONFIG } from '../config/app';

const API_BASE_URL = APP_CONFIG.apiBaseUrl01;

/**
 * 用户数据结构
 */
export interface User {
  id: string;
  email: string;
  phone?: string;
  username?: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  locale?: string;
  timezone?: string;
  currency?: string;
  status: string;
  email_verified: boolean;
  phone_verified: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * 租户数据结构
 */
export interface Tenant {
  id: string;
  code: string;
  name: string;
  display_name: string;
  logo_url?: string;
  plan_type: string;
}

/**
 * 组织单元数据结构
 */
export interface OrgUnit {
  id: string;
  name: string;
  code: string;
  org_type: string;
}

/**
 * 成员身份数据结构
 */
export interface Membership {
  id: string;
  session_token?: string;
  refresh_token?: string;
  expires_at?: string;
  tenant: Tenant;
  org_unit?: OrgUnit;
  member_type: string;
  title?: string;
  department?: string;
  level?: string;
  status: string;
  permission_level: string;
  data_access_level: string;
  is_primary: boolean;
  joined_at: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  login_identifier: string;
  password: string;
  tenant_code?: string;
  tenant_id?: string;
  remember_me?: boolean;
  device_info?: DeviceInfo;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  email: string;
  phone?: string;
  username?: string;
  password: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  tenant_id: string;
  org_unit_id?: string;
  role_ids?: string[];
  device_info?: DeviceInfo;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  device_type: 'web' | 'mobile' | 'desktop' | 'api';
  device_name: string;
  device_model?: string;
  user_agent?: string;
  platform?: string;
  os_version?: string;
  app_version?: string;
  last_ip?: string;
  last_location?: Record<string, any>;
  is_trusted?: boolean;
  fingerprint?: string;
  push_token?: string;
  push_provider?: string;
  push_enabled?: boolean;
  push_settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * 认证数据（本地存储的标准格式）
 */
export interface AuthData {
  user: User;
  current_membership: Membership;
  main_membership?: Membership; // CONNECT 租户下的 membership
  memberships: Membership[];
  session_token: string;
  refresh_token: string;
  current_membership_id: string;
  tenant_id: string;
}

/**
 * CONNECT 项目固定租户 ID
 * 用于识别和保存主 membership
 */
export const CONNECT_TENANT_ID = '04987bc8-e8e6-432a-b592-430efbe164fc';

/**
 * 本地存储键名
 */
const STORAGE_KEYS = {
  USER: 'auth_user',
  SESSION_TOKEN: 'auth_session_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  CURRENT_MEMBERSHIP_ID: 'auth_current_membership_id',
  TENANT_ID: 'auth_tenant_id',
  CURRENT_MEMBERSHIP: 'auth_current_membership',
  MAIN_MEMBERSHIP: 'auth_main_membership', // CONNECT 租户下的 membership
  MEMBERSHIPS: 'auth_memberships',
} as const;

/**
 * 获取设备信息
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      device_type: 'web',
      device_name: 'Unknown',
    };
  }

  const userAgent = navigator.userAgent;
  let deviceName = 'Unknown Browser';
  
  if (userAgent.includes('Chrome')) {
    deviceName = 'Chrome Browser';
  } else if (userAgent.includes('Firefox')) {
    deviceName = 'Firefox Browser';
  } else if (userAgent.includes('Safari')) {
    deviceName = 'Safari Browser';
  } else if (userAgent.includes('Edge')) {
    deviceName = 'Edge Browser';
  }

  return {
    device_type: 'web',
    device_name: deviceName,
    device_model: userAgent,
    user_agent: userAgent,
    platform: 'web',
    os_version: navigator.platform,
    app_version: '1.0.0',
    last_ip: undefined,
    last_location: {},
    is_trusted: true,
    fingerprint: generateFingerprint(),
    push_token: undefined,
    push_provider: undefined,
    push_enabled: false,
    push_settings: {},
    metadata: {},
  };
}

/**
 * 生成设备指纹
 */
function generateFingerprint(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Fingerprint', 2, 2);
    const fingerprint = canvas.toDataURL();
    
    const combined = `${navigator.userAgent}${navigator.language}${screen.width}x${screen.height}${fingerprint}`;
    return btoa(combined).substring(0, 32);
  } catch (error) {
    // 如果生成失败，使用简单的字符串
    return btoa(`${navigator.userAgent}${navigator.language}`).substring(0, 32);
  }
}

/**
 * 保存认证数据到本地存储（统一标准格式）
 */
export function saveAuthData(data: {
  user: User;
  current_membership?: Membership;
  membership?: Membership; // 注册接口返回的字段名
  memberships?: Membership[];
}): void {
  if (typeof window === 'undefined') {
    return;
  }

  const currentMembership = data.current_membership || data.membership;
  const memberships = data.memberships || (currentMembership ? [currentMembership] : []);
  
  // 注意：注册时，currentMembership（用户指定租户的 membership）可能没有 session_token
  // 但主 membership（CONNECT 租户）有 session_token，这是正常的
  if (!currentMembership) {
    console.warn('保存认证数据失败：缺少当前 membership');
    return;
  }

  // 查找 CONNECT 租户下的 membership（主 membership）
  const mainMembership = memberships.find(
    m => m.tenant.id === CONNECT_TENANT_ID
  );

  // 保存用户信息
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  
  // 保存会话令牌（使用主 membership 的 session_token，因为这是 CONNECT 租户的）
  // 如果没有找到主 membership，使用当前 membership 的 token
  const sessionToken = mainMembership?.session_token || currentMembership.session_token;
  if (sessionToken) {
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);
  } else {
    console.warn('保存认证数据失败：缺少会话令牌');
    return;
  }
  
  // 保存刷新令牌
  const refreshToken = mainMembership?.refresh_token || currentMembership.refresh_token;
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken as string);
  }
  
  // 保存当前成员身份ID（用户选择的租户）
  localStorage.setItem(STORAGE_KEYS.CURRENT_MEMBERSHIP_ID, currentMembership.id);
  
  // 保存当前租户ID（用户选择的租户）
  localStorage.setItem(STORAGE_KEYS.TENANT_ID, currentMembership.tenant.id);
  
  // 保存当前成员身份完整信息（用户选择的租户）
  localStorage.setItem(STORAGE_KEYS.CURRENT_MEMBERSHIP, JSON.stringify(currentMembership));
  
  // 保存主成员身份（CONNECT 租户下的 membership）
  if (mainMembership) {
    localStorage.setItem(STORAGE_KEYS.MAIN_MEMBERSHIP, JSON.stringify(mainMembership));
  } else {
    // 如果没有找到主 membership，但当前 membership 就是 CONNECT 租户的，也保存
    if (currentMembership.tenant.id === CONNECT_TENANT_ID) {
      localStorage.setItem(STORAGE_KEYS.MAIN_MEMBERSHIP, JSON.stringify(currentMembership));
    }
  }
  
  // 保存所有成员身份列表
  if (memberships.length > 0) {
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(memberships));
  }
}

/**
 * 获取用户信息
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('解析用户数据失败:', error);
    return null;
  }
}

/**
 * 获取会话令牌
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
}

/**
 * 获取刷新令牌
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * 获取当前成员身份ID
 */
export function getCurrentMembershipId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEYS.CURRENT_MEMBERSHIP_ID);
}

/**
 * 获取租户ID（从认证数据中）
 */
export function getAuthTenantId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEYS.TENANT_ID);
}

/**
 * 获取当前成员身份（用户选择的租户）
 */
export function getCurrentMembership(): Membership | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const membershipStr = localStorage.getItem(STORAGE_KEYS.CURRENT_MEMBERSHIP);
  if (!membershipStr) {
    return null;
  }

  try {
    return JSON.parse(membershipStr) as Membership;
  } catch (error) {
    console.error('解析成员身份数据失败:', error);
    return null;
  }
}

/**
 * 获取主成员身份（CONNECT 租户下的 membership）
 */
export function getMainMembership(): Membership | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const membershipStr = localStorage.getItem(STORAGE_KEYS.MAIN_MEMBERSHIP);
  if (!membershipStr) {
    return null;
  }

  try {
    return JSON.parse(membershipStr) as Membership;
  } catch (error) {
    console.error('解析主成员身份数据失败:', error);
    return null;
  }
}

/**
 * 获取所有成员身份列表
 */
export function getMemberships(): Membership[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const membershipsStr = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
  if (!membershipsStr) {
    return [];
  }

  try {
    return JSON.parse(membershipsStr) as Membership[];
  } catch (error) {
    console.error('解析成员身份列表失败:', error);
    return [];
  }
}

/**
 * 获取完整的认证数据
 */
export function getAuthData(): AuthData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const user = getUser();
  const sessionToken = getSessionToken();
  const refreshToken = getRefreshToken();
  const currentMembershipId = getCurrentMembershipId();
  const tenantId = getAuthTenantId();
  const currentMembership = getCurrentMembership();
  const mainMembership = getMainMembership();
  const memberships = getMemberships();

  if (!user || !sessionToken || !currentMembershipId || !tenantId || !currentMembership) {
    return null;
  }

  return {
    user,
    current_membership: currentMembership,
    main_membership: mainMembership || undefined,
    memberships: memberships.length > 0 ? memberships : [currentMembership],
    session_token: sessionToken,
    refresh_token: refreshToken || '',
    current_membership_id: currentMembershipId,
    tenant_id: tenantId,
  };
}

/**
 * 清除所有认证数据
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_MEMBERSHIP_ID);
  localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_MEMBERSHIP);
  localStorage.removeItem(STORAGE_KEYS.MAIN_MEMBERSHIP);
  localStorage.removeItem(STORAGE_KEYS.MEMBERSHIPS);
}

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  const sessionToken = getSessionToken();
  return !!sessionToken;
}

export function isEmailVerified(): boolean {
  const user = getUser();
  return user?.email_verified === true;
}

export function setEmailVerified(verified: boolean): void {
  if (typeof window === 'undefined') return;
  const user = getUser();
  if (!user) return;
  localStorage.setItem(
    STORAGE_KEYS.USER,
    JSON.stringify({ ...user, email_verified: verified })
  );
}

/**
 * 从租户用户静态 JSON 刷新本地 email / email_verified。失败时保留本地数据。
 */
export async function refreshLocalAuthFromUserProfile(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isAuthenticated()) return false;
  const membershipId = getCurrentMembershipId();
  const tenantId = getAuthTenantId() || APP_CONFIG.tenantId;
  const localUser = getUser();
  if (!membershipId || !tenantId || !localUser) return false;

  try {
    const url = `${APP_CONFIG.apiBaseUrl}/tenant_${tenantId}/users/user-profile-${membershipId}.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const json = (await res.json()) as {
      success?: boolean;
      data?: { user?: Partial<User> & Record<string, unknown> };
    };
    if (!json?.success || !json.data?.user) return false;
    const remote = json.data.user;
    const merged: User = {
      ...localUser,
      email: typeof remote.email === 'string' ? remote.email : localUser.email,
      email_verified:
        typeof remote.email_verified === 'boolean'
          ? remote.email_verified
          : localUser.email_verified,
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

/**
 * 用户登录
 */
export async function login(
  loginIdentifier: string,
  password: string,
  tenantId?: string,
  rememberMe: boolean = false
): Promise<{
  user: User;
  memberships: Membership[];
  current_membership: Membership;
}> {
  // 获取 tenantId：优先使用传入的参数，其次从全局变量获取，最后使用默认值
  let tenant_id = tenantId;
  if (!tenant_id && typeof window !== 'undefined') {
    tenant_id = (window as any).__ASTRO_TENANT_ID__;
  }
  if (!tenant_id) {
    tenant_id = APP_CONFIG.tenantId;
  }

  const requestData: LoginRequest = {
    login_identifier: loginIdentifier,
    password: password,
    tenant_id: tenant_id || APP_CONFIG.tenantId,
    remember_me: rememberMe,
    device_info: getDeviceInfo(),
  };

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '登录失败');
  }

  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error('登录响应格式错误');
  }

  // 保存认证数据
  saveAuthData({
    user: result.data.user,
    current_membership: result.data.current_membership,
    memberships: result.data.memberships || [],
  });

  return result.data;
}

/**
 * 用户注册
 */
export async function register(
  email: string,
  password: string,
  displayName: string,
  tenantId?: string,
  phone?: string,
  username?: string,
  firstName?: string,
  lastName?: string,
  orgUnitId?: string,
  roleIds?: string[]
): Promise<{
  user: {
    user: User;
    membership: Membership;
    memberships: Membership[];
  };
}> {
  // 获取 tenantId：优先使用传入的参数，其次从全局变量获取，最后使用默认值
  let tenant_id = tenantId;
  if (!tenant_id && typeof window !== 'undefined') {
    tenant_id = (window as any).__ASTRO_TENANT_ID__;
  }
  if (!tenant_id) {
    tenant_id = APP_CONFIG.tenantId;
  }

  const requestData: RegisterRequest = {
    email,
    password,
    display_name: displayName,
    tenant_id: tenant_id || APP_CONFIG.tenantId,
    phone,
    username,
    first_name: firstName,
    last_name: lastName,
    org_unit_id: orgUnitId,
    role_ids: roleIds,
    device_info: getDeviceInfo(),
  };

  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '注册失败');
  }

  const result = await response.json();
  
  if (!result.success || !result.data?.user) {
    throw new Error('注册响应格式错误');
  }

  // 注册接口返回结构：
  // - membership: CONNECT 租户的 membership（主身份，is_primary: true）
  // - memberships: 数组，包含两个 membership：
  //   1. CONNECT 租户的 membership
  //   2. 用户指定租户的 membership（is_primary: false）
  const memberships = result.data.user.memberships || [];
  
  // 找到用户指定租户的 membership（非 CONNECT 租户的，或 is_primary: false 的）
  const userTenantMembership = memberships.find(
    (m: Membership) => m.tenant.id !== CONNECT_TENANT_ID || m.is_primary === false
  ) || memberships.find((m: Membership) => !m.is_primary);
  
  // 如果找不到用户租户的 membership，使用 CONNECT 租户的作为 fallback
  const currentMembership = userTenantMembership || result.data.user.membership;

  // 保存认证数据
  saveAuthData({
    user: result.data.user.user,
    current_membership: currentMembership, // 用户指定租户的 membership
    membership: result.data.user.membership, // CONNECT 租户的 membership（用于查找主 membership）
    memberships: memberships,
  });

  return result.data;
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  const sessionToken = getSessionToken();
  
  if (sessionToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('登出API调用失败:', error);
    }
  }

  // 无论API调用是否成功，都清除本地数据
  clearAuthData();
}

/**
 * 验证Token
 */
export async function verifyToken(sessionToken?: string): Promise<{
  valid: boolean;
  membership_id?: string;
  user_id?: string;
  tenant_id?: string;
  expires_at?: string;
  message: string;
} | null> {
  const token = sessionToken || getSessionToken();
  
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_token: token,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Token验证失败:', error);
    return null;
  }
}

/**
 * 修改密码请求参数
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * 修改密码响应
 */
export interface ChangePasswordResponse {
  success: boolean;
  data: {
    message: string;
  };
}

/**
 * 修改密码
 */
export async function changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const sessionToken = getSessionToken();
  
  if (!sessionToken) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_BASE_URL}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.error?.message || errorData.message || '修改密码失败');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || result.message || '修改密码失败');
  }

  return result;
}

/**
 * 更新用户资料请求参数
 */
export interface UpdateProfileRequest {
  email?: string;
  phone?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  locale?: string;
  timezone?: string;
  currency?: string;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * 更新用户资料响应
 */
export interface UpdateProfileResponse {
  success: boolean;
  data: {
    user: User;
    memberships: Membership[];
  };
}

/**
 * 更新用户资料
 */
export async function updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  const sessionToken = getSessionToken();
  
  if (!sessionToken) {
    throw new Error('未登录，请先登录');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.error?.message || errorData.message || '更新用户资料失败');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || result.message || '更新用户资料失败');
  }

  // 如果返回了新的用户数据，更新本地存储
  if (result.data?.user) {
    const currentAuthData = getAuthData();
    if (currentAuthData) {
      saveAuthData({
        user: result.data.user,
        current_membership: currentAuthData.current_membership,
        memberships: result.data.memberships || currentAuthData.memberships,
      });
    }
  }

  return result;
}

