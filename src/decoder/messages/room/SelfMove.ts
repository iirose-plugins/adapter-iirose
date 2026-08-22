export interface SelfMove
{
  id: string;
}

/**
 * 解析自身移动房间的消息
 * @param message 消息
 * @returns {{id: string} | undefined}
 */
export const selfMove = (message: string) =>
{
  if (message.substring(0, 2) === '-*')
  {
    const msg = {
      id: message.substring(2),
    };

    // SelfMove
    return msg;
  }
};
