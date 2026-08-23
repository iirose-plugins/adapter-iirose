import { IIROSE_Bot } from "../../../../bot/bot";

// 用户资料数据结构
export interface UserProfileByName
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

// 解析通过用户名获取的用户资料
export function parseUserProfileByName(data: string, bot: IIROSE_Bot, fallbackUsername?: string): UserProfileByName | null
{
  try
  {
    const p = data.slice(1).split('>');

    if (p[0] === '1')
    {
      const birthday = p[3] ? new Date(Number(p[3]) * 1000) : null;
      const images = (p[9] || '').split(/\s+/).filter(Boolean);
      const musicParts = (p[11] || '').split('@|');
      const media = (musicParts[0] || '').trim().split(/\s+/).filter(Boolean);
      const follow = (p[18] || '0<0').split('<');
      const impression = (p[41] || '').replace(/^@/, '').split(',');
      const communityNames = (p[16] || '')
        .replace(/^0336"/, '')
        .split("'")
        .map((name) => name.trim())
        .filter(Boolean);

      return {
        gender: 'unknown',
        nickname: `${p[1] || ''}${p[2] || ''}` || fallbackUsername || '',
        username: fallbackUsername || `${p[1] || ''}${p[2] || ''}`,
        birthday: birthday ? birthday.toLocaleDateString() : '',
        age: birthday ? Math.floor((Date.now() - birthday.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0,
        residence: '',
        tag: p[22] || '',
        hobby: p[6] || '',
        sandbox: '',
        registrationTime: p[12] ? new Date(Number(p[12]) * 1000).toLocaleString() : '',
        id: '',
        isCertified: false,
        impression: {
          percentage: Number(impression[1]) || 0,
          count: Number(impression[0]) || 0,
          multiplier: Number(impression[2]) || 0,
        },
        credit: Number(p[36]) || 0,
        money: Number(p[17]) || 0,
        following: Number(follow[0]) || 0,
        followers: Number(follow[1]) || 0,
        visits: Number(p[13]) || 0,
        lastLoginTime: p[12] ? new Date(Number(p[12]) * 1000).toLocaleTimeString() : '',
        todayActivity: Number(p[36]) || 0,
        activity: Number(p[40]) || 0,
        onlineDuration: Number(p[25]) || 0,
        communities: communityNames,
        backgroundMusic: {
          name: musicParts[1] || '',
          artist: musicParts[2] || '',
          audio: media[0] || '',
          cover: media[1] || '',
          link: musicParts[4] || '',
        },
        bio: p[8] || '',
        location: '',
        locationId: '',
        status: p[15] || '',
        dislikes: Number(p[42]) || 0,
        likes: Number(p[19]) || 0,
        comments: [],
        album: images[0] || '',
        background: images[1] || '',
      };
    }

    const basicInfo = p[0].split('"');
    const musicInfo = (p[11] || '').split('@|');
    const impressionData = (p[42] || p[30] || '').split(',');

    const profile: UserProfileByName = {
      gender: basicInfo[0] === '1' ? 'male' : (basicInfo[0] === '2' ? 'female' : 'unknown'),
      nickname: basicInfo[1] || '',
      username: basicInfo[2] || '',
      birthday: basicInfo[3] ? new Date(parseInt(basicInfo[3]) * 1000).toLocaleDateString() : '',
      age: basicInfo[3] ? Math.floor((Date.now() - new Date(parseInt(basicInfo[3]) * 1000).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0,
      residence: basicInfo[4] || '',
      tag: p[15] || '',
      hobby: p[6] || '',
      sandbox: p[28] || '',
      registrationTime: p[12] ? new Date(parseInt(p[12]) * 1000).toLocaleString() : '',
      id: p[25] || '',
      isCertified: (p[20] || '').includes('1'),
      impression: {
        percentage: impressionData[1] ? parseInt(impressionData[1]) : 0,
        count: impressionData[0] ? parseInt(impressionData[0].slice(1)) : 0,
        multiplier: impressionData[2] ? parseFloat(impressionData[2]) : 0
      },
      credit: p[34] ? parseInt(p[34]) : 0,
      money: p[17] ? parseFloat(p[17]) : 0,
      following: p[18] ? parseInt(p[18].split('<')[0]) : 0,
      followers: p[18] ? parseInt(p[18].split('<')[1]) : 0,
      visits: p[13] ? parseInt(p[13]) : 0,
      lastLoginTime: p[23] ? new Date(parseInt(p[23]) * 1000).toLocaleTimeString() : '',
      todayActivity: p[36] ? parseInt(p[36]) : 0,
      activity: p[41] ? parseInt(p[41]) : 0,
      onlineDuration: p[24] ? parseInt(p[24]) : 0,
      communities: (p[26] || '').slice(1, -1).split('"@').filter(c => c.length > 0),
      backgroundMusic: {
        name: musicInfo[1] || '',
        artist: musicInfo[2] || ''
      },
      bio: p[8] || '',
      location: p[21] || '',
      locationId: (p[26] || '').split('"@')[1] || '',
      status: p[20] || '',
      dislikes: p[35] ? parseInt(p[35]) : 0,
      likes: p[16] ? parseInt(p[16].split("'")[0]) : 0,
      comments: (p[16] || '').split("'").slice(1),
      album: p[9] || ''
    };

    return profile;
  } catch (error)
  {
    bot.logger.error("Failed to parse user profile by name:", error);
    return null;
  }
}
