import { decode } from '../../../utils/entities';
import { parseAvatar } from '../../../utils/utils';
import { replyMessage, replyMsg } from './PublicMessage';

interface data
{
  timestamp: number;
  uid: string;
  username: string;
  avatar: string;
  message: string;
  color: string;
  messageId: number;
  replyMessage: replyMessage[] | null;
}

export class PrivateMessage
{
  public timestamp: number;
  public uid: string;
  public username: string;
  public avatar: string;
  public message: string;
  public color: string;
  public messageId: number;
  public replyMessage: replyMessage[] | null;

  constructor(data: data)
  {
    this.timestamp = data.timestamp;
    this.uid = data.uid;
    this.username = data.username;
    this.avatar = data.avatar;
    this.message = data.message;
    this.color = data.color;
    this.messageId = data.messageId;
    this.replyMessage = data.replyMessage;
  }
}

/**
 * 解析私聊消息
 * @param message 消息
 * @returns {PrivateMessage | null}
 */
export const privateMessage = (message: string) =>
{
  if (message.substring(0, 2) === '""')
  {
    const item = message.substring(2).split('<');

    for (const msg of item)
    {
      const tmp = msg.split('>');

      if (tmp.length === 11)
      {
        if (/^\d+$/.test(tmp[0]))
        {
          const [realMessage, reply] = replyMsg(tmp[4]);

          const msg = new PrivateMessage({
            timestamp: Number(tmp[0]),
            uid: tmp[1],
            username: decode(tmp[2]),
            avatar: parseAvatar(tmp[3]),
            message: decode(realMessage),
            color: tmp[5],
            messageId: Number(tmp[10]),
            replyMessage: reply,
          });
          // PrivateMessage
          return msg;
        }
      }
    }

    return null;
  }
};
