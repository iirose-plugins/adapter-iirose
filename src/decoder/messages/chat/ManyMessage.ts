import { decode } from '../../../utils/entities';
import { IIROSE_Bot } from '../../../bot/bot';
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
  title?: string;
  messageId?: number;
  replyMessage?: replyMessage[] | null;
  payload?: any;
}

export class ManyMessage
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
  public type: string | null;
  public payload: any;

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
    this.type = data.type;
    this.payload = data.payload;
  }
}

/**
 * 解析消息中的回复部分
 * @param msg 消息字符串
 * @returns {replyMessage[] | null}
 */
const replyMsg = (msg: string): replyMessage[] | null =>
{
  if (msg.includes(' (_hr) '))
  {
    const replies: replyMessage[] = [];

    msg.split(' (hr_) ').forEach(e =>
    {
      if (e.includes(' (_hr) '))
      {
        const tmp = e.split(' (_hr) ');
        const user = tmp[1].split('_');

        replies.unshift({
          message: decode(tmp[0]),
          username: decode(user[0]),
          time: Number(user[1]),
        });

        replies.sort((a, b) =>
        {
          return (a.time - b.time);
        });
      } else
      {
        // @ts-ignore
        replies.unshift(e);
      }
    });

    return replies;
  }

  return null;
};

/**
 * 解析包含多条消息的包
 * @param input 消息
 * @param bot bot实例
 * @returns {ManyMessage[] | null}
 */
export const manyMessage = (input: string, bot: IIROSE_Bot) =>
{
  if (input.substring(0, 1) !== '"') return null;
  const message: string = input.substring(1);

  if (message.indexOf('<') !== -1)
  {
    const tmp1 = message.split('<');

    const output: ManyMessage[] = [];

    tmp1.forEach(e =>
    {
      const tmp = e.split('>');
      tmp[0] = tmp[0].replace('"', '');

      if (/^\d+$/.test(tmp[0]))
      {
        if (tmp.length === 11)
        {
          // PrivateMessage
          if (!isNaN(Number(tmp[8])) && Number(tmp[8]) > -1 && Number(tmp[8]) < 5)
          {
            if (bot.config.uid == tmp[1])
            {
              return;
            }
            output.push(new ManyMessage({
              type: 'privateMessage',
              timestamp: Number(tmp[0]),
              avatar: parseAvatar(tmp[3]),
              username: decode(tmp[2]),
              message: decode(tmp[4]),
              color: tmp[5],
              uid: tmp[1],
              messageId: Number(tmp[10]),
            }));
          } else
          {
            if (bot.config.uid == tmp[8])
            {
              return;
            }
            const reply = replyMsg(tmp[3]);
            output.push(new ManyMessage({
              type: 'publicMessage',
              timestamp: Number(tmp[0]),
              avatar: parseAvatar(tmp[1]),
              username: decode(tmp[2]),
              message: decode(reply ? String(reply.shift()) : tmp[3]),
              color: tmp[5],
              uid: tmp[8],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              messageId: Number(tmp[10]),
              replyMessage: reply,
            }));
          }
        } else if (tmp.length === 12)
        {
          if (bot.config.uid == tmp[8])
          {
            return;
          }
          if (tmp[3] === "'1")
          {
            const joinStatusMatch = tmp[11].match(/^[^']*'([nd])/);
            const memberUpdateData = {
              type: 'join',
              joinType: joinStatusMatch && joinStatusMatch[1] === 'd' ? 'reconnect' : 'new',
              timestamp: Number(tmp[0]),
              avatar: parseAvatar(tmp[1]),
              username: decode(tmp[2]),
              uid: tmp[8],
              room: tmp[11].split("'")[0],
              color: tmp[5],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
            };
            output.push(new ManyMessage({
              type: 'memberUpdate',
              payload: memberUpdateData,
              timestamp: memberUpdateData.timestamp,
              avatar: parseAvatar(memberUpdateData.avatar),
              username: memberUpdateData.username,
              uid: memberUpdateData.uid,
              color: memberUpdateData.color,
            }));
          } else if (tmp[3].substring(0, 2) === "'2")
          {
            const memberUpdateData = {
              type: 'leave',
              timestamp: Number(tmp[0]),
              avatar: parseAvatar(tmp[1]),
              username: decode(tmp[2]),
              uid: tmp[8],
              room: tmp[11].split("'")[0],
              color: tmp[5],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              isMove: true,
              targetRoomId: tmp[3].substring(2)
            };
            output.push(new ManyMessage({
              type: 'memberUpdate',
              payload: memberUpdateData,
              timestamp: memberUpdateData.timestamp,
              avatar: parseAvatar(memberUpdateData.avatar),
              username: memberUpdateData.username,
              uid: memberUpdateData.uid,
              color: memberUpdateData.color,
            }));
          } else if (tmp[3] === "'3")
          {
            const memberUpdateData = {
              type: 'leave',
              timestamp: Number(tmp[0]),
              avatar: parseAvatar(tmp[1]),
              username: decode(tmp[2]),
              uid: tmp[8],
              room: tmp[11].split("'")[0],
              color: tmp[5],
              title: tmp[9] === "'108" ? '花瓣' : tmp[9],
              isMove: false
            };
            output.push(new ManyMessage({
              type: 'memberUpdate',
              payload: memberUpdateData,
              timestamp: memberUpdateData.timestamp,
              avatar: parseAvatar(memberUpdateData.avatar),
              username: memberUpdateData.username,
              uid: memberUpdateData.uid,
              color: memberUpdateData.color,
            }));
          }
        }
      }
    });
    return output;
  }
};
