import { decode } from '../../../../utils/entities';
import { parseAvatar } from '../../../../utils/utils';

export interface SelfStatus
{
  timestamp: number;
  avatar: string;
  username: string;
  uid: string;
  color: string;
  room: string;
}

/**
 * 解析登录后服务器下发的机器人自身状态小报文
 */
export const parseSelfStatus = (message: string, selfId: string): SelfStatus | undefined =>
{
  if (!message.startsWith('"')) return undefined;

  const fields = message.slice(1).split('>');
  if (fields.length < 12 || fields[3] !== "'1") return undefined;

  const uid = fields[8];
  if (!uid || uid.toLowerCase() !== selfId.toLowerCase()) return undefined;
  if (!fields[1] || !fields[2]) return undefined;

  return {
    timestamp: Number(fields[0]) || 0,
    avatar: parseAvatar(fields[1]),
    username: decode(fields[2]),
    uid,
    color: fields[5] || '',
    room: (fields[11] || '').split("'")[0],
  };
};
