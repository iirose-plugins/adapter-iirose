import { IIROSE_Bot } from "../../../../bot/bot";
import { parseFullUserProfileByName } from "./FullUserProfileByName";
import type { FullUserProfileByName } from "./FullUserProfileByName";

// 解析通过用户名获取的用户资料
export function parseUserProfileByName(data: string, bot: IIROSE_Bot, fallbackUsername?: string): FullUserProfileByName | null
{
  try
  {
    const p = data.slice(1).split('>');

    if (p[0] === '1')
    {
      const full = parseFullUserProfileByName(data, bot, fallbackUsername);
      if (!full)
      {
        return null;
      }
      return full;
    }

    const basicInfo = p[0].split('"');
    const musicInfo = (p[11] || '').split('@|');
    const impressionData = (p[42] || p[30] || '').split(',');
    const activity = p[41] ? parseInt(p[41]) : 0;

    const profile: FullUserProfileByName = {
      gender: basicInfo[0] === '1' ? 'male' : (basicInfo[0] === '2' ? 'female' : 'unknown'),
      nickname: basicInfo[1] || '',
      username: basicInfo[2] || '',
      surname: '',
      givenName: '',
      birthday: basicInfo[3] ? new Date(parseInt(basicInfo[3]) * 1000).toLocaleDateString() : '',
      age: basicInfo[3] ? Math.floor((Date.now() - new Date(parseInt(basicInfo[3]) * 1000).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0,
      residence: basicInfo[4] || '',
      tag: p[15] || '',
      hobby: p[6] || '',
      hobbies: [],
      friends: [],
      sandbox: p[28] || '',
      registrationTime: p[12] ? new Date(parseInt(p[12]) * 1000).toLocaleString() : '',
      id: p[25] || '',
      isCertified: (p[20] || '').includes('1'),
      title: '',
      accountStatus: '',
      timezone: '',
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
      activity,
      totalActivity: activity,
      onlineDuration: p[24] ? parseInt(p[24]) : 0,
      communities: (p[26] || '').slice(1, -1).split('"@').filter(c => c.length > 0),
      backgroundMusic: {
        name: musicInfo[1] || '',
        artist: musicInfo[2] || '',
        audio: '',
        cover: '',
        link: ''
      },
      bio: p[8] || '',
      location: p[21] || '',
      locationId: (p[26] || '').split('"@')[1] || '',
      status: p[20] || '',
      likers: [],
      topLiker: '',
      dislikes: p[35] ? parseInt(p[35]) : 0,
      likes: p[16] ? parseInt(p[16].split("'")[0]) : 0,
      comments: (p[16] || '').split("'").slice(1),
      album: p[9] || '',
      background: '',
      contribution: 0,
      bankDeposit: 0,
      debt: 0,
      donations: 0,
      albumImages: [],
    };

    return profile;
  } catch (error)
  {
    bot.logger.error("Failed to parse user profile by name:", error);
    return null;
  }
}
