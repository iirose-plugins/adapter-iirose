import { parseAvatar } from "../../../../utils/utils";

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
    // 新格式以 $?1" 开头，split 后首位是空串；旧格式没有 1，首位直接是用户名
    const offset = parts[0] === '' ? 1 : 0;
    return {
      username: parts[offset] || '',
      email: (parts[offset + 1] || '').trim(),
      lastName: parts[offset + 2] || '',
      firstName: parts[offset + 3] || '',
      birthday: parts[offset + 4] || '',
      onlineStatus: parts[offset + 5] || '',
      address: parts[offset + 6] || '',
      personalWebsite: parts[offset + 7] || '',
      hobbies: parts[offset + 8] || '',
      friends: parts[offset + 9] || '',
      uid: parts[offset + 14] || '',
      avatar: parseAvatar(parts[offset + 13] || ''),
      currentRoom: parts[offset + 15] || '',
      phone: parts[parts.length - 1].split('<')[0], // a bit tricky
    };
  }

  return null;
};
