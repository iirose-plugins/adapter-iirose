import { parseAvatar } from "../../utils/utils";

export interface LeaderboardUser
{
  name: string;
  someNumber: string;
  unknownData: string;
  avatar: string;
  uid: string;
  balance: string;
}

export interface Leaderboard
{
  timestamp: string;
  users: LeaderboardUser[];
}

/**
 * 解析排行榜数据
 * @param message 消息
 * @returns {Leaderboard | null}
 */
export const parseLeaderboard = (message: string): Leaderboard | null =>
{
  if (!message.startsWith('`#'))
  {
    return null;
  }

  const content = message.substring(2);
  if (!content) return null;

  const timestampEndIndex = content.indexOf('"');
  if (timestampEndIndex === -1)
  {
    return null; // 格式不正确
  }

  const timestamp = content.substring(0, timestampEndIndex);
  const usersData = content.substring(timestampEndIndex + 1);

  const userStrings = usersData.split('<');
  const users: LeaderboardUser[] = userStrings.map(userString =>
  {
    if (userString.trim() === '') return null;
    const parts = userString.split('>');
    if (parts.length >= 6)
    { // 至少需要7个部分，因为有一个是空的
      return {
        name: parts[0],
        someNumber: parts[1],
        unknownData: parts[3],
        avatar: parseAvatar(parts[4]),
        uid: parts[5],
        balance: parts[6],
      };
    }
    return null;
  }).filter(Boolean) as LeaderboardUser[];

  return { timestamp, users };
};
