export interface MediaWhitelistEntry
{
  username: string;
  uid: string;
  expireAt: number;
  intro: string;
}

export interface MediaWhitelistEvent
{
  type: 'added' | 'removed';
  expireAt?: number;
  intro?: string;
  roomId?: string;
}

export const MEDIA_WHITELIST_LIST_PREFIX = 'a2';
export const MEDIA_WHITELIST_ADD_ACK_PREFIXES = ['_~F', '_~X', 'qw'];
export const MEDIA_WHITELIST_REMOVE_ACK_PREFIXES = ['qW', '_~F', '_~X'];
export const MEDIA_WHITELIST_CLEAR_ACK_PREFIXES = ['qW', '_~F', '_~X'];

/**
 * 解析“限制发言&点播”白名单列表
 * @param message 消息
 * @returns {MediaWhitelistEntry[] | undefined}
 */
export const parseMediaWhitelistList = (message: string): MediaWhitelistEntry[] | undefined =>
{
  if (!message.startsWith(MEDIA_WHITELIST_LIST_PREFIX)) return undefined;

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
 * 解析“限制发言&点播”白名单增删事件
 * @param message 消息
 * @returns {MediaWhitelistEvent | undefined}
 */
export const parseMediaWhitelistEvent = (message: string): MediaWhitelistEvent | undefined =>
{
  if (message.startsWith('qw'))
  {
    const tmp = message.slice(2).split('>');
    return {
      type: 'added',
      expireAt: Number(tmp[0]) || undefined,
      intro: tmp[1] || undefined,
      roomId: tmp[2] || undefined,
    };
  }

  if (message.startsWith('qW'))
  {
    return {
      type: 'removed',
      roomId: message.slice(2) || undefined,
    };
  }
};
