import { parseAvatar } from "../../utils/utils";

export interface BroadcastMessage
{
  // 用户名
  username: string;
  // 消息内容
  message: string;
  // 颜色
  color: string;
  // 头像
  avatar: string;
  // 时间戳 (实际上是消息序列ID)
  timestamp: string;
  // 消息ID
  messageId: string;
}

/**
 * 解析广播消息
 * @param msg 消息
 * @returns {BroadcastMessage | undefined}
 */
export const broadcastMessage = (msg: string): BroadcastMessage | undefined =>
{
  // 检查消息是否以 "=" 开头
  if (!msg.startsWith('='))
  {
    return undefined;
  }

  // 使用 ">" 分割消息
  const parts = msg.slice(1).split('>');
  // 检查字段数量是否足够
  if (parts.length < 8)
  {
    return undefined;
  }

  // 返回解析后的数据
  return {
    username: parts[0],
    message: parts[1],
    color: parts[2],
    avatar: parseAvatar(parts[5]),
    timestamp: parts[6],
    messageId: parts[7],
  };
};
