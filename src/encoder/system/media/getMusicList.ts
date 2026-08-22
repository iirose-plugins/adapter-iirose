import { decode } from '../../../utils/entities';

export interface MediaListItem
{
  id: string;
  length: number;
  title: string;
  artist: string;
  requester: string;
  cover: string;
  color?: string;
  name?: string;
  type?: number;
  avatar?: string;
}

// 查询当前歌单
export default function getMusicList(): string
{
  return '%a';
}

/**
 * 解析媒体列表回调
 * @param message 消息
 * @returns {MediaListItem[] | undefined}
 */
export const parseMusicList = (message: string): MediaListItem[] | undefined =>
{
  if (message.startsWith('a1'))
  {
    const content = message.substring(2);
    if (!content) return []; // 歌单为空

    const result: MediaListItem[] = content.split('<').map((e, i) =>
    {
      const tmp = e.split('>');
      return {
        id: `${i}_${tmp[0]}`,
        length: Number(tmp[0]),
        title: decode(tmp[1]),
        artist: decode((tmp[2] || '').replace(/^@\d+/, '')),
        requester: decode(tmp[3] || ''),
        cover: `http${tmp[4] || ''}`,
      };
    });
    return result;
  }
};
