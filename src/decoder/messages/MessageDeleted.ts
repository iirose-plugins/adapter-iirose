import { IIROSE_Bot } from '../../bot/bot';

export interface MessageDeletedData
{
  type: 'message-deleted';
  userId: string;
  messageId: string;
  channelId: string;
  timestamp: number;
}

/**
 * 解析消息撤回数据
 * 公共频道格式: v0#用户ID_消息ID"
 * 私信格式: v0*消息接收方"消息撤回方_消息ID
 */
export function MessageDeleted(bot: IIROSE_Bot, message: string): MessageDeletedData | null
{
  // 匹配公共频道撤回消息格式: v0#用户ID_消息ID"
  const publicDeleteMatch = message.match(/^v0#([^_]+)_([^"]+)"?$/);
  if (publicDeleteMatch)
  {
    const [, userId, messageId] = publicDeleteMatch;
    // 公共频道
    let channelId = bot.config.roomId;
    if (bot.config.smStart)
    {
      channelId = bot.config.smRoom;
    }
    return {
      type: 'message-deleted',
      userId,
      messageId,
      channelId,
      timestamp: Date.now()
    };
  }
  // 私信撤回消息格式: v0*消息接收方"消息撤回方_消息ID
  const privateDeleteMatch = message.match(/^v0\*([^"]+)"([^_]+)_(\d+)$/);
  if (privateDeleteMatch)
  {
    const [, receiverId, senderId, messageId] = privateDeleteMatch;
    const channelId = `private:${senderId}`;
    return {
      type: 'message-deleted',
      userId: senderId,
      messageId,
      channelId,
      timestamp: Date.now()
    };
  }

  return null;
}
