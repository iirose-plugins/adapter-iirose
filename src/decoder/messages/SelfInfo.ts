import { parseAvatar } from "../../utils/utils";

export interface SelfInfo
{
  username: string;
  email: string;
  lastName: string;
  firstName: string;
  birthday: string;
  onlineStatus: string;
  address: string;
  personalWebsite: string;
  hobbies: string;
  friends: string;
  uid: string;
  avatar: string;
  currentRoom: string;
  phone: string;
  // ... and other fields
}

/**
 * 解析自身信息
 * @param message 消息
 * @returns {SelfInfo | null}
 */
export const parseSelfInfo = (message: string): SelfInfo | null =>
{
  if (!message.startsWith('$?'))
  {
    return null;
  }

  const parts = message.substring(3).split('"');

  if (parts.length >= 14)
  {
    return {
      username: parts[0],
      email: parts[1],
      lastName: parts[2],
      firstName: parts[3],
      birthday: parts[4],
      onlineStatus: parts[5],
      address: parts[6],
      personalWebsite: parts[7],
      hobbies: parts[8],
      friends: parts[9],
      uid: parts[10],
      avatar: parseAvatar(parts[11]),
      currentRoom: parts[12],
      phone: parts[parts.length - 1].split('<')[0], // a bit tricky
    };
  }

  return null;
};
