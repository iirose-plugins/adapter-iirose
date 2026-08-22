import { musicOrigin } from "../../bot/type";

/**
 * 构建媒体数据消息
 * @param type 媒体类型, 'music' 或 'video'
 * @param title 标题
 * @param signer 艺术家
 * @param cover 封面URL
 * @param link 来源链接
 * @param url 媒体URL
 * @param duration 时长 (秒)
 * @param lyrics 歌词 (可选)
 * @param origin 来源平台 (可选)
 * @returns {string}
 */
export default (
  type: 'music' | 'video',
  title: string,
  signer: string,
  cover: string,
  link: string,
  url: string,
  duration: number,
  lyrics: string | null = null,
  origin?: musicOrigin['origin']
) =>
{
  const typeMap = {
    music: "=0",
    video: "=1",
    netease: "@0",
    xiamimusic: "@1",
    qqmusic: "@2",
    qianqianmusic: "@3",
    kugoumusic: "@4",
    ximalayafm: "@5",
    lizhifm: "@6",
    echohuisheng: "@7",
    fivesing: "@8",
    iqiyi: "!0",
    tencentvideo: "!1",
    youtube: "!2",
    bilibili: "!3",
    mangotv: "!4",
    tiktok: "!5",
    kuaishou: "!6",
    onesixthreemv: "!7",
    bilibililive: "!8"
  };

  let t: string;
  if (origin && origin !== 'null' && origin !== 'undefined')
  {
    t = origin;
  } else
  {
    t = type;
  }

  const data = JSON.stringify({
    s: url.substring(4),
    d: duration,
    c: cover.substring(4),
    n: title,
    r: signer,
    b: `${typeMap[t]}`,
    o: link.substring(4),
    l: lyrics
  });

  return `&1${data}`;
};
