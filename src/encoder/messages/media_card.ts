
import PublicMessage from './PublicMessage';
import { musicOrigin } from '../../bot/event';
import { encode } from '../../utils/entities';

/**
 * 构建媒体卡片消息
 * @param type 媒体类型, 'music' 或 'video'
 * @param title 标题
 * @param singer 艺术家
 * @param cover 封面URL
 * @param color 颜色
 * @param duration 时长 (秒)
 * @param BitRate 比特率 (可选, 默认 320)
 * @param origin 来源平台 (可选)
 * @returns {any}
 */
export default (
  type: 'music' | 'video',
  title: string,
  singer: string,
  cover: string,
  color: string,
  duration: number,
  BitRate: number = 320,
  origin?: musicOrigin['origin']
) =>
{
  /**
   * 解析比特率
   * @param bitrate 比特率
   * @returns {string | number}
   */
  function parseBitrate(bitrate: number)
  {
    switch (bitrate)
    {
      case 10000:
        return '1e4';
      case 20000:
        return '2e4';
      case 30000:
        return '3e4';
      default:
        return bitrate;
    }
  }

  /**
   * 将时长(秒)转换为文本格式
   * @param duration 时长(秒)
   * @returns {string}
   */
  function durationToText(duration: number)
  {
    const secondsInMinute = 60;
    const secondsInHour = secondsInMinute * 60;
    const secondsInDay = secondsInHour * 24;
    const secondsInYear = secondsInDay * 365;
    const secondsInMillennium = secondsInYear * 1000;
    const secondsInTenThousandYears = secondsInMillennium * 10;
    const secondsInHundredThousandYears = secondsInTenThousandYears * 10;
    const secondsInMillionYears = secondsInHundredThousandYears * 10;
    const secondsInTenMillionYears = secondsInMillionYears * 10;
    const secondsInHundredMillionYears = secondsInTenMillionYears * 10;
    const secondsInBillionYears = secondsInHundredMillionYears * 10;

    const billionYears = Math.floor(duration / secondsInBillionYears);
    duration %= secondsInBillionYears;

    const hundredMillionYears = Math.floor(duration / secondsInHundredMillionYears);
    duration %= secondsInHundredMillionYears;

    const tenMillionYears = Math.floor(duration / secondsInTenMillionYears);
    duration %= secondsInTenMillionYears;

    const millionYears = Math.floor(duration / secondsInMillionYears);
    duration %= secondsInMillionYears;

    const hundredThousandYears = Math.floor(duration / secondsInHundredThousandYears);
    duration %= secondsInHundredThousandYears;

    const tenThousandYears = Math.floor(duration / secondsInTenThousandYears);
    duration %= secondsInTenThousandYears;

    const millennia = Math.floor(duration / secondsInMillennium);
    duration %= secondsInMillennium;

    const years = Math.floor(duration / secondsInYear);
    duration %= secondsInYear;

    const days = Math.floor(duration / secondsInDay);
    duration %= secondsInDay;

    const hours = Math.floor(duration / secondsInHour);
    duration %= secondsInHour;

    const minutes = Math.floor(duration / secondsInMinute);
    const seconds = duration % secondsInMinute;

    let text = '';
    if (billionYears > 0)
    {
      text += `${billionYears}亿年 `;
    }
    if (hundredMillionYears > 0)
    {
      text += `${hundredMillionYears}亿年 `;
    }
    if (tenMillionYears > 0)
    {
      text += `${tenMillionYears}千万年 `;
    }
    if (millionYears > 0)
    {
      text += `${millionYears}百万年 `;
    }
    if (hundredThousandYears > 0)
    {
      text += `${hundredThousandYears}十万年 `;
    }
    if (tenThousandYears > 0)
    {
      text += `${tenThousandYears}万年 `;
    }
    if (millennia > 0)
    {
      text += `${millennia}千年 `;
    }
    if (years > 0)
    {
      text += `${years}年 `;
    }
    if (days > 0)
    {
      text += `${days}天 `;
    }
    if (hours > 0)
    {
      text += `${hours}小时 `;
    }
    if (minutes > 0)
    {
      text += `${minutes}分钟 `;
    }
    if (seconds > 0)
    {
      text += `${seconds}秒`;
    }

    return text.trim();
  }

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
    iqiyi: "*0",
    tencentvideo: "*1",
    youtube: "*2",
    bilibili: "*3",
    mangotv: "*4",
    tiktok: "*5",
    kuaishou: "*6",
    onesixthreemv: "*7",
    bilibililive: "*8"
  };
  let data: string;

  let t: string;
  if (origin && origin !== 'null' && origin !== 'undefined')
  {
    t = origin;
  } else
  {
    t = type;
  }

  title = encode(title);
  singer = encode(singer);
  color = encode(color);
  if (type === 'music')
  {
    if (!BitRate)
    {
      data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>>11451${durationToText(duration)}`;
    } else
    {
      data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>${parseBitrate(BitRate)}`;
    }
  } else
  {
    if (!BitRate)
    {
      data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>>11451${durationToText(duration)}`;
    } else
    {
      data = `m__4${typeMap[t]}>${title}>${singer}>${cover}>${color}>>${parseBitrate(BitRate)}>>${durationToText(duration)}`;
    }
  }
  return PublicMessage(data, color);
};

/**
 * 将秒数格式化为 mm:ss
 * @param seconds 秒数
 * @returns {string}
 */
function formatSeconds(seconds: number): string
{
  const minutes: number = Math.floor(seconds / 60);
  const remainingSeconds: number = seconds % 60;
  const formattedMinutes: string = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds: string = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
  return `${formattedMinutes}:${formattedSeconds}`;
}
