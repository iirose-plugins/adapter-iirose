/**
 * 机器人自己被踢出房间
 * 收到: -k
 */
export const kicked = (message: string): boolean | undefined =>
{
  return message === '-k' ? true : undefined;
};
