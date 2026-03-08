import { parseAvatar } from "../../utils/utils";

export interface ForumPost
{
  name: string;
  avatar: string;
  type: string;
  content: string;
  // ... other fields based on your description
}

export interface Forum
{
  posts: ForumPost[];
}

/**
 * 解析论坛数据
 * @param message 消息
 * @returns {Forum | null}
 */
export const parseForum = (message: string): Forum | null =>
{
  if (!message.startsWith(':-'))
  {
    return null;
  }

  const content = message.substring(2);
  if (!content) return { posts: [] };

  const posts: ForumPost[] = content.split('<').map(postString =>
  {
    const parts = postString.split('>');
    return {
      name: parts[0],
      avatar: parseAvatar(parts[1]),
      type: parts[2],
      content: parts[3],
      // ... and so on
    };
  });

  return { posts };
};
