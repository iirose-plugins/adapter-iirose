import type { MediaWhitelistEntry } from './MediaWhitelist';

export interface RoomRestrictionEvent
{
  type: 'speech' | 'music' | 'both';
  level: number;
}

export interface MuteListEntry
{
  username: string;
  uid: string;
  expireAt: number;
  intro: string;
  type: number;
}

export interface MuteEvent
{
  type: 'added' | 'removed';
  expireAt?: number;
  intro?: string;
  roomId?: string;
  muteType?: number;
}

export interface BlacklistEvent
{
  type: 'added' | 'blocked';
  expireAt?: number;
  intro?: string;
  roomId?: string;
}

export const SPEECH_RESTRICTION_PREFIX = '_~!';
export const MUSIC_RESTRICTION_PREFIX = '_~@';
export const BOTH_RESTRICTION_PREFIX = '_~#';

export const MUTE_LIST_PREFIX = 'a2';
export const MUTE_ADD_ACK_PREFIXES = ['_~F', '_~*', 'q3'];
export const MUTE_REMOVE_ACK_PREFIXES = ['q#', '_~F', '_~*'];
export const MUTE_CLEAR_ACK_PREFIXES = ['q#', '_~F', '_~*', '_~E'];

export const BLACKLIST_LIST_PREFIX = 'a2';
export const BLACKLIST_ADD_ACK_PREFIXES = ['_~F', '_~*', 'q4'];
export const BLACKLIST_REMOVE_ACK_PREFIXES = ['_~F', '_~*', 'q4'];
export const BLACKLIST_CLEAR_ACK_PREFIXES = ['_~F', '_~*', 'q4'];

/**
 * 解析房间发言/点播限制事件
 * 发言: _~!N
 * 点播: _~@N
 * 同时限制: _~#NN
 */
export const parseRoomRestriction = (message: string): RoomRestrictionEvent | undefined =>
{
  const speech = message.match(/^_~!([0-5])$/);
  if (speech)
  {
    return { type: 'speech', level: Number(speech[1]) };
  }

  const music = message.match(/^_~@([0-5])$/);
  if (music)
  {
    return { type: 'music', level: Number(music[1]) };
  }

  const both = message.match(/^_~#([0-5])\1$/);
  if (both)
  {
    return { type: 'both', level: Number(both[1]) };
  }
};

/**
 * 判断房间限制回执是否匹配指定类型和等级
 */
export const isRoomRestrictionAck = (
  message: string,
  type: RoomRestrictionEvent['type'],
  level: number,
): boolean =>
{
  const parsed = parseRoomRestriction(message);
  return parsed?.type === type && parsed.level === level;
};

/**
 * 解析禁言列表
 * a2username>$uid>expireAt>intro>type
 */
export const parseMuteList = (message: string): MuteListEntry[] | undefined =>
{
  if (!message.startsWith(MUTE_LIST_PREFIX)) return undefined;

  const content = message.slice(2);
  if (!content) return [];

  return content.split('<').map((entry) =>
  {
    const tmp = entry.split('>');
    return {
      username: tmp[0] || '',
      uid: (tmp[1] || '').replace(/^\$/, ''),
      expireAt: Number(tmp[2]) || 0,
      intro: tmp[3] || '',
      type: Number(tmp[4]) || 0,
    };
  });
};

/**
 * 解析禁言事件
 * 新增: q3expireAt>intro>roomId>type
 * 解除: q#roomId>type
 */
export const parseMuteEvent = (message: string): MuteEvent | undefined =>
{
  if (message.startsWith('q3'))
  {
    const tmp = message.slice(2).split('>');
    return {
      type: 'added',
      expireAt: Number(tmp[0]) || undefined,
      intro: tmp[1] || undefined,
      roomId: tmp[2] || undefined,
      muteType: Number(tmp[3]) || undefined,
    };
  }

  if (message.startsWith('q#'))
  {
    const tmp = message.slice(2).split('>');
    return {
      type: 'removed',
      roomId: tmp[0] || undefined,
      muteType: Number(tmp[1]) || undefined,
    };
  }
};

/**
 * 解析黑名单列表
 * a2username>$uid>expireAt>intro
 */
export const parseBlacklistList = (message: string): MediaWhitelistEntry[] | undefined =>
{
  if (!message.startsWith(BLACKLIST_LIST_PREFIX)) return undefined;

  const content = message.slice(2);
  if (!content) return [];

  return content.split('<').map((entry) =>
  {
    const tmp = entry.split('>');
    return {
      username: tmp[0] || '',
      uid: (tmp[1] || '').replace(/^\$/, ''),
      expireAt: Number(tmp[2]) || 0,
      intro: tmp[3] || '',
    };
  });
};

/**
 * 解析黑名单事件
 * 新增: q4expireAt>intro>roomId
 * 登录被拦截: m!bexpireAt#intro
 */
export const parseBlacklistEvent = (message: string): BlacklistEvent | undefined =>
{
  if (message.startsWith('q4'))
  {
    const tmp = message.slice(2).split('>');
    return {
      type: 'added',
      expireAt: Number(tmp[0]) || undefined,
      intro: tmp[1] || undefined,
      roomId: tmp[2] || undefined,
    };
  }

  if (message.startsWith('m!b'))
  {
    const tmp = message.slice(3).split('#');
    return {
      type: 'blocked',
      expireAt: Number(tmp[0]) || undefined,
      intro: tmp[1] || undefined,
    };
  }
};
