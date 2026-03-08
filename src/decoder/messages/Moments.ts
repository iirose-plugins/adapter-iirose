import { parseAvatar } from "../../utils/utils";

export interface MomentPost
{
  name: string;
  avatar: string;
  type: string;
  uid: string;
  content: string;
  // ... other fields
}

export interface Moments
{
  posts: MomentPost[];
}

/**
 * 解析朋友圈数据
 * @param message 消息
 * @returns {Moments | null}
 */
export const parseMoments = (message: string): Moments | null =>
{
  if (!message.startsWith(':='))
  {
    return null;
  }

  const content = message.substring(2);
  if (!content) return { posts: [] };

  const posts: MomentPost[] = content.split('<').map(postString =>
  {
    const parts = postString.split('>');
    return {
      name: parts[0],
      avatar: parseAvatar(parts[1]),
      type: parts[2],
      uid: parts[3],
      content: parts[4],
      // ... and so on
    };
  });

  return { posts };
};
