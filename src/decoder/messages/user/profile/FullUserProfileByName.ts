import { IIROSE_Bot } from "../../../../bot/bot";
import { decode } from "../../../../utils/entities";
import { parseAvatar } from "../../../../utils/utils";

/** 旧版资料字段，作为完整资料类型的基础结构 */
interface UserProfileByName
{
  /** 性别 */
  gender: 'male' | 'female' | 'unknown';
  /** 昵称/显示名 */
  nickname: string;
  /** 用户名 */
  username: string;
  /** 生日 */
  birthday: string;
  /** 年龄 */
  age: number;
  /** 居住地/坐标 */
  residence: string;
  /** 标签 */
  tag: string;
  /** 爱好 */
  hobby: string;
  /** 个人空间标识 */
  sandbox: string;
  /** 注册时间 */
  registrationTime: string;
  /** 唯一标识 ID */
  id: string;
  /** 是否已认证 */
  isCertified: boolean;
  /** 印象数据 */
  impression: {
    /** 印象占比 */
    percentage: number;
    /** 印象人数 */
    count: number;
    /** 印象倍数 */
    multiplier: number;
  };
  /** 贡献值 */
  credit: number;
  /** 金钱（钞） */
  money: number;
  /** 关注数 */
  following: number;
  /** 粉丝数 */
  followers: number;
  /** 访问量 */
  visits: number;
  /** 最后登录时间 */
  lastLoginTime: string;
  /** 今日活跃（分钟） */
  todayActivity: number;
  /** 活跃时长（分钟） */
  activity: number;
  /** 在线时长（小时） */
  onlineDuration: number;
  /** 社区列表 */
  communities: string[];
  /** 背景音乐 */
  backgroundMusic: {
    /** 歌名 */
    name: string;
    /** 作者 */
    artist: string;
    /** 音频地址 */
    audio?: string;
    /** 封面地址 */
    cover?: string;
    /** 歌曲链接 */
    link?: string;
  };
  /** 个人简介 */
  bio: string;
  /** 坐标/当前位置 */
  location: string;
  /** 坐标 ID */
  locationId: string;
  /** 在线状态 */
  status: string;
  /** 踩 */
  dislikes: number;
  /** 赞 */
  likes: number;
  /** 留言/评论 */
  comments: string[];
  /** 相册置顶图片 */
  album: string;
  /** 个人资料背景图 */
  background?: string;
}

/** 通过用户名获取的完整用户资料 */
export interface FullUserProfileByName extends UserProfileByName
{
  /** 姓 */
  surname: string;
  /** 名 */
  givenName: string;
  /** 爱好列表 */
  hobbies: string[];
  /** 好友列表 */
  friends: string[];
  /** 个人资料背景图 */
  background: string;
  /** 背景音乐 */
  backgroundMusic: {
    /** 歌名 */
    name: string;
    /** 作者 */
    artist: string;
    /** 音频地址 */
    audio: string;
    /** 封面地址 */
    cover: string;
    /** 歌曲链接 */
    link: string;
  };
  /** 头衔 */
  title: string;
  /** 账户状态原始标记 */
  accountStatus: string;
  /** 时区 */
  timezone: string;
  /** 获赞者列表 */
  likers: string[];
  /** 获赞最多者 */
  topLiker: string;
  /** 贡献 */
  contribution: number;
  /** 总活跃（分钟） */
  totalActivity: number;
  /** 银行存款 */
  bankDeposit: number;
  /** 欠款 */
  debt: number;
  /** 捐款 */
  donations: number;
  /** 相册/生活图片 */
  albumImages: {
    /** 图片地址 */
    url: string;
    /** 发布时间 */
    timestamp?: number;
    /** 图片描述 */
    description: string;
  }[];
}

const toNumber = (value: string | undefined): number =>
{
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toLocalTime = (value: string | undefined): string =>
{
  const timestamp = Number(value);
  if (!value || !Number.isFinite(timestamp)) return '';
  return new Date(timestamp * 1000).toLocaleString();
};

/** 解码 IIROSE 资料里的 HTML 实体，包括数字实体 */
const decodeProfile = (value: string): string =>
  decode(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));

const splitList = (value: string | undefined): string[] =>
  decodeProfile(value || '')
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeImage = (value: string): string =>
{
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  // 旧数据缺失协议头时统一补成 https
  if (trimmed.startsWith('://')) return trimmed.replace(/^:\/\//, 'https://');
  if (trimmed.startsWith('cartoon/')) return parseAvatar(trimmed);
  return trimmed;
};

const parseProfileImages = (value: string | undefined): { album: string; background: string; } =>
{
  const images = decodeProfile(value || '')
    .split(/\s+/)
    .map(normalizeImage)
    .filter(Boolean);
  return {
    album: images[0] || '',
    background: images[1] || images[0] || '',
  };
};

const parseBackgroundMusic = (value: string | undefined): FullUserProfileByName['backgroundMusic'] =>
{
  const musicParts = decodeProfile(value || '').split('@|');
  const media = (musicParts[0] || '')
    .trim()
    .split(/\s+/)
    .map(normalizeImage)
    .filter(Boolean);
  const link = musicParts[4] || '';
  return {
    name: musicParts[1] || '',
    artist: musicParts[2] || '',
    audio: media[0] || '',
    cover: media[1] || '',
    link: link.startsWith('s://') ? link.replace(/^s:\/\//, 'https://') : link,
  };
};

const parseLikers = (value: string | undefined): { likes: number; likers: string[]; } =>
{
  const likeParts = decodeProfile(value || '').split('"');
  const likesMatch = likeParts[0]?.match(/\d+/);
  const likers = (likeParts[1] || '')
    .split("'")
    .map((item) => decodeProfile(item).trim())
    .filter(Boolean);
  return {
    likes: likesMatch ? Number(likesMatch[0]) : 0,
    likers,
  };
};

const parseCommunities = (value: string | undefined): string[] =>
  decodeProfile(value || '')
    .split('"')
    .map((item) => item.replace(/^@/, '').trim())
    .filter(Boolean);

const parseAlbumImages = (value: string | undefined): FullUserProfileByName['albumImages'] =>
  decodeProfile(value || '')
    .split('<')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
    {
      const match = entry.match(/^(\S+)(?:\s+(\d{10,}))?(?:\s+([\s\S]*))?$/);
      if (!match)
      {
        return { url: normalizeImage(entry), description: '' };
      }
      return {
        url: normalizeImage(match[1] || ''),
        timestamp: match[2] ? Number(match[2]) : undefined,
        description: (match[3] || '').trim(),
      };
    })
    .filter((image) => Boolean(image.url));

/**
 * 解析通过用户名获取的完整用户资料
 * @param data 服务器返回的 +1 资料报文
 * @param bot IIROSE_Bot 实例
 * @param fallbackUsername 查询时使用的用户名
 */
export function parseFullUserProfileByName(data: string, bot: IIROSE_Bot, fallbackUsername?: string): FullUserProfileByName | null
{
  try
  {
    const p = data.slice(1).split('>');
    if (p[0] !== '1')
    {
      return null;
    }

    const displayName = decodeProfile(`${p[1] || ''}${p[2] || ''}`).trim();
    const birthdayTimestamp = Number(p[3]);
    const birthday = p[3] && Number.isFinite(birthdayTimestamp) ? new Date(birthdayTimestamp * 1000) : null;
    const profileImages = parseProfileImages(p[9]);
    const hobbies = splitList(p[6]);
    const friends = splitList(p[7]);
    const { likes, likers } = parseLikers(p[16]);
    const follow = (p[18] || '0<0').split('<');
    const impressionParts = decodeProfile(p[41] || '').replace(/^[@*]/, '').split(',');
    const dislikesMatch = (p[29] || '').match(/\d+/);
    const totalActivity = toNumber(p[40]);

    return {
      username: fallbackUsername || displayName,
      surname: decodeProfile(p[1] || ''),
      givenName: decodeProfile(p[2] || ''),
      nickname: fallbackUsername || displayName,
      hobby: hobbies.join(','),
      sandbox: '',
      isCertified: false,
      activity: totalActivity,
      location: '',
      locationId: '',
      comments: likers,
      id: '',
      gender: 'unknown',
      birthday: birthday ? birthday.toLocaleDateString() : '',
      age: birthday ? Math.floor((Date.now() - birthday.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0,
      residence: decodeProfile(p[4] || p[5] || '').trim(),
      hobbies,
      friends,
      bio: decodeProfile(p[8] || '').trim(),
      album: profileImages.album,
      background: profileImages.background,
      backgroundMusic: parseBackgroundMusic(p[11]),
      lastLoginTime: toLocalTime(p[12]),
      visits: toNumber(p[13]),
      title: decodeProfile(p[14] || '').trim(),
      accountStatus: p[27] || '',
      status: p[28] || '',
      timezone: p[15] || '',
      likes,
      likers,
      topLiker: likers[0] || '',
      money: toNumber(p[17]),
      following: toNumber(follow[0]),
      followers: toNumber(follow[1]),
      contribution: toNumber(p[19]),
      communities: parseCommunities(p[21]),
      tag: decodeProfile(p[22] || '').trim(),
      registrationTime: toLocalTime(p[24]),
      onlineDuration: toNumber(p[25]),
      todayActivity: toNumber(p[42]),
      totalActivity,
      credit: toNumber(p[32]),
      bankDeposit: toNumber(p[33]),
      debt: toNumber(p[34]),
      donations: toNumber(p[35]),
      dislikes: dislikesMatch ? Number(dislikesMatch[0]) : 0,
      impression: {
        count: toNumber(impressionParts[0]),
        percentage: toNumber(impressionParts[1]),
        multiplier: toNumber(impressionParts[2]),
      },
      albumImages: parseAlbumImages(p[31]),
    };
  } catch (error)
  {
    bot.logger.error('Failed to parse full user profile by name:', error);
    return null;
  }
}
