/**
 * 聊天相关的 API 服务
 * 用于处理客服聊天、会话管理、消息发送和接收等功能
 */

import { APP_CONFIG } from '../config/app';
import { getSessionToken, getCurrentMembershipId, getAuthTenantId } from './auth';

const API_BASE_URL = APP_CONFIG.apiBaseUrl01;
const JSON_BASE_URL = APP_CONFIG.apiBaseUrl;

/**
 * 客服信息
 */
export interface Agent {
  membership_id: string;
  display_name: string;
  avatar_url?: string;
  status?: string;
}

/**
 * 会话信息
 */
export interface Conversation {
  id: string;
  my_status: string;
  is_deleted: boolean;
  last_message_seq: number;
  my_last_read_seq: number;
  unread_count: number;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  other_user: {
    user_id: string;
    membership_id: string;
    display_name: string;
    avatar_url?: string;
    title?: string;
    department?: string;
    status: string;
  };
  last_message: null;
}

/**
 * 消息信息
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  seq: number;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  content?: string;
  content_json?: any;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  is_pinned: boolean;
  is_important: boolean;
  is_deleted: boolean;
  receiver_read_at?: string;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  sender: {
    user_id: string;
    membership_id: string;
    display_name: string;
    avatar_url?: string;
    status: string;
  };
}

/**
 * WebSocket 消息格式
 */
export interface WebSocketMessage {
  type: string;
  id?: string;
  conversation_id?: string;
  data?: {
    id?: string;
    message_type?: string;
    sender_id?: string;
    conversation_id?: string;
    chat_type?: string;
    content?: string;
    seq?: number;
    status?: string;
    created_at?: string;
    sender?: {
      user_id: string;
      membership_id: string;
      display_name: string;
      avatar_url?: string;
      status: string;
    };
  };
  timestamp?: number;
}

/**
 * 租户设置
 */
export interface TenantSettings {
  data: {
    id: string;
    settings?: {
      kf?: string[]; // 客服 membership_id 列表
    };
  };
  success: boolean;
}

/**
 * 获取或创建会话请求
 */
export interface GetOrCreateConversationsRequest {
  membership_ids: string[];
}

/**
 * 获取或创建会话响应
 */
export interface GetOrCreateConversationsResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
  };
}

/**
 * 获取消息列表响应
 */
export interface GetConversationMessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
    };
  };
}

/**
 * 发送消息请求
 */
export interface SendMessageRequest {
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  content: string;
}

/**
 * 发送消息响应
 */
export interface SendMessageResponse {
  success: boolean;
  data: {
    message: string;
    data: Message;
  };
}

/**
 * 标记已读请求
 */
export interface MarkConversationAsReadRequest {
  last_message_seq: number;
}

/**
 * 标记已读响应
 */
export interface MarkConversationAsReadResponse {
  success: boolean;
  data: {
    message: string;
  };
}

/**
 * 获取客户端配置
 */
function getClientConfig() {
  const win = typeof window !== 'undefined' ? (window as any) : null;
  return {
    tenantId: win?.__ASTRO_TENANT_ID__ || getAuthTenantId() || APP_CONFIG.tenantId,
    apiBaseUrl: API_BASE_URL,
    jsonBaseUrl: JSON_BASE_URL,
  };
}

/**
 * 获取租户设置（包含客服ID列表）
 * @param tenantId 租户ID
 */
export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  const config = getClientConfig();
  const url = `${config.jsonBaseUrl}/tenant_${tenantId}/tenants/tenant-${tenantId}.json`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tenant settings: ${response.statusText}`);
  }
  
  const data: TenantSettings = await response.json();
  return data;
}

/**
 * 获取或创建会话
 * @param membershipIds 客服的 membership_id 数组
 */
export async function getOrCreateConversations(
  membershipIds: string[]
): Promise<Conversation[]> {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    throw new Error('Session token is required');
  }
  
  const config = getClientConfig();
  const url = `${config.apiBaseUrl}/chat/direct/conversations/by-memberships`;
  
  const requestBody: GetOrCreateConversationsRequest = {
    membership_ids: membershipIds,
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.tenantId,
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to get or create conversations: ${response.statusText}`);
  }
  
  const result = data as GetOrCreateConversationsResponse;
  return result.data.conversations;
}

/**
 * 获取会话消息列表
 * @param conversationId 会话ID
 * @param params 查询参数
 */
export async function getConversationMessages(
  conversationId: string,
  params?: {
    page?: number;
    page_size?: number;
    before_seq?: number;
    after_seq?: number;
    include_deleted?: boolean;
  }
): Promise<{ messages: Message[]; pagination: any }> {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    throw new Error('Session token is required');
  }
  
  const config = getClientConfig();
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }
  if (params?.before_seq !== undefined) {
    queryParams.append('before_seq', params.before_seq.toString());
  }
  if (params?.after_seq !== undefined) {
    queryParams.append('after_seq', params.after_seq.toString());
  }
  if (params?.include_deleted !== undefined) {
    queryParams.append('include_deleted', params.include_deleted.toString());
  }
  
  const queryString = queryParams.toString();
  const url = `${config.apiBaseUrl}/chat/direct/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.tenantId,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to get messages: ${response.statusText}`);
  }
  
  const result = data as GetConversationMessagesResponse;
  return {
    messages: result.data.messages,
    pagination: result.data.pagination,
  };
}

/**
 * 发送消息
 * @param conversationId 会话ID
 * @param messageType 消息类型
 * @param content 消息内容
 */
export async function sendMessage(
  conversationId: string,
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file',
  content: string
): Promise<Message> {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    throw new Error('Session token is required');
  }
  
  const config = getClientConfig();
  const url = `${config.apiBaseUrl}/chat/direct/conversations/${conversationId}/messages`;
  
  const requestBody: SendMessageRequest = {
    message_type: messageType,
    content: content,
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.tenantId,
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to send message: ${response.statusText}`);
  }
  
  const result = data as SendMessageResponse;
  return result.data.data;
}

/**
 * 标记消息已读
 * @param conversationId 会话ID
 * @param lastMessageSeq 最后一条消息的序列号
 */
export async function markConversationAsRead(
  conversationId: string,
  lastMessageSeq: number
): Promise<void> {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    throw new Error('Session token is required');
  }
  
  const config = getClientConfig();
  const url = `${config.apiBaseUrl}/chat/direct/conversations/${conversationId}/read`;
  
  const requestBody: MarkConversationAsReadRequest = {
    last_message_seq: lastMessageSeq,
  };
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': config.tenantId,
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to mark conversation as read: ${response.statusText}`);
  }
}

/**
 * 创建 WebSocket 连接
 * @param sessionToken 会话令牌
 */
export function createWebSocketConnection(sessionToken: string): WebSocket {
  const wsUrl = `wss://websocket01.goodsoftwarepro.com?token=${sessionToken}`;
  return new WebSocket(wsUrl);
}

/**
 * 解析 WebSocket 消息
 * @param data WebSocket 消息数据（字符串）
 */
export function parseWebSocketMessage(data: string): WebSocketMessage | null {
  try {
    const message = JSON.parse(data) as WebSocketMessage;
    return message;
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
    return null;
  }
}

/**
 * 导出客户端对象
 */
export const clientChat = {
  getTenantSettings,
  getOrCreateConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  createWebSocketConnection,
  parseWebSocketMessage,
};
