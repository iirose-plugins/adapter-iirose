import { decode } from '../../../utils/entities';
import { parseAvatar } from '../../../utils/utils';

export interface MediaListItem
{
  id: string;
  length: number;
  title: string;
  color: string;
  name: string;
  type: number;
  avatar: string;
  cover: string;
}

// 查询当前歌单
export default function getMusicList(): string
{
  return '%';
}

/**
 * 解析媒体列表回调
 * @param message 消息
 * @returns {MediaListItem[] | undefined}
 */
export const parseMusicList = (message: string): MediaListItem[] | undefined =>
{
  if (message.startsWith('~'))
  {
    const content = message.substring(1);
    if (!content) return []; // 歌单为空

    const result: MediaListItem[] = content.split('<').map((e, i) =>
    {
      const tmp = e.split('>');
      return {
        id: `${i}_${tmp[0]}`,
        length: Number(tmp[0]),
        title: decode(tmp[1]),
        color: tmp[2].substring(0, 6),
        name: tmp[2].substring(6),
        type: Number(tmp[3]),
        avatar: parseAvatar(tmp[4]),
        cover: `http${tmp[5]}`,
      };
    });
    return result;
  }
};
