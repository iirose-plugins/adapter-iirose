import { parseAvatar } from "../../utils/utils";

export interface Task
{
  name: string;
  avatar: string;
  type: string;
  content: string;
  // ... other fields
}

export interface Tasks
{
  tasks: Task[];
}

/**
 * 解析任务数据
 * @param message 消息
 * @returns {Tasks | null}
 */
export const parseTasks = (message: string): Tasks | null =>
{
  if (!message.startsWith(':+'))
  {
    return null;
  }

  const content = message.substring(2);
  if (!content) return { tasks: [] };

  const tasks: Task[] = content.split('<').map(taskString =>
  {
    const parts = taskString.split('>');
    return {
      name: parts[0],
      avatar: parseAvatar(parts[1]),
      type: parts[2],
      content: parts[3],
      // ... and so on
    };
  });

  return { tasks };
};
