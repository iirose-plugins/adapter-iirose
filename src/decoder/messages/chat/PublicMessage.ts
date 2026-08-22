import { decode } from '../../../utils/entities';
import { parseAvatar } from '../../../utils/utils';

export interface replyMessage
{
  message: string;
  username: string;
  time: number;
}

interface data
{
  type?: string;
  timestamp: number;
  avatar: string;
  username: string;
  message?: string;
  color: string;
  uid: string;
  title: string;
  messageId?: number;
  replyMessage?: replyMessage[] | null;
}

export class PublicMessage
{
  public timestamp: number;
  public avatar: string;
  public username: string;
  public message: string;
  public color: string;
  public uid: string;
  public title: string;
  public messageId: number;
  public replyMessage: replyMessage[] | null;

  constructor(data: data)
  {
    this.timestamp = data.timestamp;
    this.avatar = data.avatar;
    this.username = data.username;
    this.message = data.message;
    this.color = data.color;
    this.uid = data.uid;
    this.title = data.title;
    this.messageId = data.messageId;
    this.replyMessage = data.replyMessage;
  }
}

/**
 * 解析消息中的回复部分
 * @param msg 消息字符串
 * @returns {[string, replyMessage[] | null]} 返回一个元组，包含处理后的消息和回复数组
 */
export const replyMsg = (msg: string): [string, replyMessage[] | null] =>
{
  // 判断是否为引用消息
  if (!msg.includes(' (_hr) '))
  {
    return [msg, null];
  }

  const parts = msg.split(' (hr_) ');
  const newMsg = parts.pop()!; // 最后一部分是新消息
  const replies: replyMessage[] = [];

  for (const part of parts)
  {
    const quoteParts = part.split(' (_hr) ');
    if (quoteParts.length === 2)
    {
      const [message, authorPart] = quoteParts;
      const authorMatch = authorPart.match(/(.*)_(\d+)$/);
      if (authorMatch)
      {
        const [, username, time] = authorMatch;
        replies.push({
          message: decode(message),
          username: decode(username.trim()),
          time: Number(time),
        });
      }
    }
  }
  // 返回消息和引用数组
  return [newMsg, replies.length > 0 ? replies : null];
};

/**
 * 解析公屏消息
 * @param input 消息
 * @returns {PublicMessage | null}
 */
export const publicMessage = (input: string) =>
{
  if (input.substring(0, 1) !== '"') return null;

  const message: string = input.substring(1);

  if (message.indexOf('<') === -1)
  {
    const tmp = message.split('>');
    if (tmp.length === 11)
    {
      if (/^\d+$/.test(tmp[0]))
      {
        const [message, reply] = replyMsg(tmp[3]);

        if (message.startsWith('m__4@')) { return null; }

        const msg = {
          timestamp: Number(tmp[0]),
          avatar: parseAvatar(tmp[1]),
          username: decode(tmp[2]),
          message: decode(message),
          color: tmp[5],
          uid: tmp[8],
          title: tmp[9] === "'108" ? '花瓣' : tmp[9],
          messageId: Number(tmp[10]),
          replyMessage: reply,
        };

        // PublicMessage
        return new PublicMessage(msg);
      }
    }
  }
};
