import { decode } from '../../../utils/entities';

export interface Music
{
  url: string;
  link: string;
  duration: number;
  title: string;
  singer: string;
  owner: string;
  pic: string;
  lyrics?: string; // 歌词
}

/**
 * 解析音乐消息
 * @param message 消息
 * @returns {Music | undefined}
 */
export const music = (message: string) =>
{
  if (message.substring(0, 2) === '&1')
  {
    const tmp = message.substring(2).split('>');

    if (tmp.length >= 9 && tmp[8] === '')
    {
      const msg: Music = {
        url: `http${tmp[0].split(' ')[0]}`,
        link: `http${tmp[0].split(' ')[1]}`,
        duration: Number(tmp[1]),
        title: decode(tmp[2]),
        singer: decode(tmp[3].substring(2)),
        owner: tmp[4],
        pic: `http${tmp[6]}`,
      };

      // 检查是否存在歌词
      if (tmp.length > 9 && tmp[9])
      {
        // 从第九个元素开始，后面的都可能是歌词部分，用'>'拼接回来
        const lyrics = tmp.slice(9).join('>');
        if (lyrics.trim())
        {
          msg.lyrics = lyrics.trim();
        }
      }
      return msg;
    }
  }
};
