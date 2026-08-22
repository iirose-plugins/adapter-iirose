import { decode } from '../../../../utils/entities';
import { parseAvatar } from '../../../../utils/utils';

export type MailboxMessageData =
  | {
    type: 'roomNotice';
    notice: string;
    background: string;
    timestamp: number;
  }
  | {
    type: 'follower';
    username: string;
    avatar: string;
    gender: string;
    background: string;
    timestamp: number;
    color: string;
  }
  | {
    type: 'like';
    username: string;
    avatar: string;
    gender: string;
    background: string;
    timestamp: number;
    color: string;
    message: string;
  }
  | {
    type: 'payment';
    username: string;
    avatar: string;
    gender: string;
    background: string;
    timestamp: number;
    color: string;
    message: string;
    money: number;
  }
  | {
    type: 'dislike';
    username: string;
    avatar: string;
    gender: string;
    background: string;
    timestamp: number;
    color: string;
    message: string;
  };

/**
 * 解析邮箱消息 (包括房间公告, 关注, 点赞, 支付等)
 * @param message 消息
 * @returns {MailboxMessageData | null}
 */
export const mailboxMessage = (message: string): MailboxMessageData | null =>
{
  if (!message.startsWith('@')) return null;

  const parts = message.slice(2).split('<');
  for (const part of parts)
  {
    const tmp = part.split('>');
    if (tmp.length === 3)
    {
      // roomNotice
      return {
        type: 'roomNotice',
        notice: decode(tmp[0]),
        background: tmp[1],
        timestamp: Number(tmp[2]),
      };
    }
    if (tmp.length === 7)
    {
      if (/^'\^/.test(tmp[3]))
      {
        // follower
        return {
          type: 'follower',
          username: decode(tmp[0]),
          avatar: parseAvatar(tmp[1]),
          gender: tmp[2],
          background: tmp[4],
          timestamp: Number(tmp[5]),
          color: tmp[6],
        };
      } else if (/^'\*/.test(tmp[3]))
      {
        // like
        return {
          type: 'like',
          username: decode(tmp[0]),
          avatar: parseAvatar(tmp[1]),
          gender: tmp[2],
          background: tmp[4],
          timestamp: Number(tmp[5]),
          color: tmp[6],
          message: decode(tmp[3].substring(2)),
        };
      } else if (/^'h/.test(tmp[3]))
      {
        // dislike
        return {
          type: 'dislike',
          username: decode(tmp[0]),
          avatar: parseAvatar(tmp[1]),
          gender: tmp[2],
          background: tmp[4],
          timestamp: Number(tmp[5]),
          color: tmp[6],
          message: decode(tmp[3].substring(2)),
        };
      } else if (/^'\$/.test(tmp[3]))
      {
        // payment
        return {
          type: 'payment',
          username: decode(tmp[0]),
          avatar: parseAvatar(tmp[1]),
          gender: tmp[2],
          money: parseInt(tmp[3].split(' ')[0].substring(1)),
          message: decode(tmp[3].split(' ')[1] || ''),
          background: tmp[4],
          timestamp: Number(tmp[5]),
          color: tmp[6],
        };
      }
    }
  }

  return null;
};
