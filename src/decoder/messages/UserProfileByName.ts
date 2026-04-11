import { IIROSE_Bot } from "../../bot/bot";

// 用户资料数据结构
export interface UserProfileByName
{
  gender: 'male' | 'female' | 'unknown';
  nickname: string;
  username: string;
  birthday: string;
  age: number;
  residence: string;
  tag: string;
  hobby: string;
  sandbox: string;
  registrationTime: string;
  id: string;
  isCertified: boolean;
  impression: {
    percentage: number;
    count: number;
    multiplier: number;
  };
  credit: number;
  money: number;
  following: number;
  followers: number;
  visits: number;
  lastLoginTime: string;
  todayActivity: number;
  activity: number;
  onlineDuration: number;
  communities: string[];
  backgroundMusic: {
    name: string;
    artist: string;
  };
  bio: string;
  location: string;
  locationId: string;
  status: string;
  dislikes: number;
  likes: number;
  comments: string[];
  album: string;
}

// 解析通过用户名获取的用户资料
export function parseUserProfileByName(data: string, bot: IIROSE_Bot): UserProfileByName | null
{
  try
  {
    const p = data.slice(1).split('>');

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
