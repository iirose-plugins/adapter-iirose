import { parseAvatar } from "../../../utils/utils";

export interface SwitchRoom
{
  timestamp: number;
  avatar: string;
  username: string;
  color: string;
  uid: string;
  title: string;
  room: string;
  targetRoom: string;
}

/**
 * 解析用户切换房间的消息
 * @param message 消息
 * @returns {SwitchRoom | undefined}
 */
export const switchRoom = (message: string) =>
{
  const tmp = message.split('>');
  if (tmp.length === 12)
  {
    if (/\d+/.test(tmp[0]))
    {
      if (tmp[3].substring(0, 2) === "'2")
      {
        const msg = {
          timestamp: Number(tmp[0]),
          avatar: parseAvatar(tmp[1]),
          username: tmp[2],
          color: tmp[5],
          uid: tmp[8],
          title: tmp[9] === "'108" ? '花瓣' : tmp[9],
          room: tmp[10],
          targetRoom: tmp[3].substring(2),
        };

        // SwitchRoom
        return msg;
      }
    }
  }
};
