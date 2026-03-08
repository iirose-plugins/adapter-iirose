/**
 * 单条动态的结构
 */
export interface Moment
{
  name: string;
  avatar: string;
  unknownFlag: string;
  content: string;
  image?: string;
  timestamp1: string;
  timestamp2: string;
  color: string;
  uid: string;
}

/**
 * 用户动态的整体结构
 */
export interface UserMoments
{
  background: string;
  moments: Moment[];
}

/**
 * 解析用户动态
 * @param message 消息
 * @returns {UserMoments | null}
 */
export const parseUserMoments = (message: string): UserMoments | null =>
{
  if (!message.startsWith(':*'))
  {
    return null;
  }

  const parts = message.substring(2).split('"');
  if (parts.length < 2)
  {
    return null;
  }

  const background = parts[0];
  const momentsData = parts.slice(1).join('"');
  const momentStrings = momentsData.split('<');

  const moments: Moment[] = [];

  for (const momentString of momentStrings)
  {
    if (momentString.trim() === '') continue;

    const momentParts = momentString.split('>');
    if (momentParts.length >= 9)
    {
      const moment: Moment = {
        name: momentParts[0],
        avatar: momentParts[1],
        unknownFlag: momentParts[2],
        content: momentParts[3],
        image: momentParts[4] || undefined,
        timestamp1: momentParts[5],
        timestamp2: momentParts[6],
        color: momentParts[7],
        uid: momentParts[8],
      };
      moments.push(moment);
    }
  }

  return {
    background,
    moments,
  };
};
