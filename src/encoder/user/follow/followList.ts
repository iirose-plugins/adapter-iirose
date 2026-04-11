import { parseAvatar } from '../../../utils/utils';
import { decode } from '../../../utils/entities';

// 定义关注/粉丝信息接口
export interface FollowInfo
{
  name: string;
  avatar: string;
}

// 定义关注和粉丝列表接口
export interface FollowList
{
  following: FollowInfo[];
  fans: FollowInfo[];
}

/**
 * 生成获取用户关注和粉丝列表的指令
 * @param uid 用户uid
 * @returns {string}
 */
export const getFollowAndFansPacket = (uid: string): string =>
{
  return `+^${uid}`;
};

/**
 * 解析服务器返回的关注和粉丝数据
 * @param data 原始数据字符串
 * @returns {FollowList | null}
 */
export const parseFollowAndFans = (data: string): FollowList | null =>
{
  if (!data.startsWith('|^'))
  {
    return null;
  }

  // 处理没有关注和粉丝的情况
  if (data === '|^"<"<')
  {
    return { following: [], fans: [] };
  }

  // 名字和头像由 '<' 分隔
  const parts = data.split('<');
  if (parts.length < 2) return { following: [], fans: [] };

  const allNamesRaw = parts[0];
  const allAvatarsRaw = parts[1];

  // 从名字部分解析关注和粉丝
  const namesPayload = allNamesRaw.substring(2); // 移除 '|^'
  const [followingNamesRaw, fanNamesRaw] = namesPayload.split('"');

  const followingNames = followingNamesRaw.split("'").filter(Boolean);
  const fanNames = fanNamesRaw.split("'").filter(Boolean);

  // 从头像部分解析关注和粉丝
  const [followingAvatarsRaw, fanAvatarsRaw] = allAvatarsRaw.split('"');

  const followingAvatars = followingAvatarsRaw.split("'").filter(Boolean);
  const fanAvatars = fanAvatarsRaw.split("'").filter(Boolean);

  // 组合关注列表
  const following = followingNames.map((name, i) => ({
    name: decode(name),
    avatar: parseAvatar(decode(followingAvatars[i] || '')),
  }));

  // 组合粉丝列表
  const fans = fanNames.map((name, i) => ({
    name: decode(name),
    avatar: parseAvatar(decode(fanAvatars[i] || '')),
  }));

  return { following, fans };
};
