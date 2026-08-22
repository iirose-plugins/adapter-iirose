import { decode } from '../../../utils/entities';
import { parseAvatar } from '../../../utils/utils';

export interface SystemMessage
{
  timestamp: number;
  avatar: string;
  username: string;
  color: string;
  uid: string;
  title: string;
  room: string;

}

/**
 * 解析用户加入房间的系统消息
 * @param message 消息
 * @returns {SystemMessage | undefined}
 */
export const joinRoom = (message: string) =>
{
  const tmp = message.split('>');
  if (tmp.length === 12)
  {
    if (/\d+/.test(tmp[0]))
    {
      if (tmp[3] === "'1")
      {
        const msg = {
          timestamp: Number(tmp[0]),
          avatar: parseAvatar(tmp[1]),
          username: decode(tmp[2]),
          color: tmp[5],
          uid: tmp[8],
          title: tmp[9] === "'108" ? '花瓣' : tmp[9],
          room: tmp[10],
        };
        // JoinRoom
        return msg;
      }
    }
  }
};
