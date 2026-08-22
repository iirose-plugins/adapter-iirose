/**
 * 广播发送后的服务端回执。
 * 当前协议只返回 `Ds`，不包含剩余次数，剩余次数由本地缓存维护。
 * @param message 消息
 * @returns 是否为广播回执
 */
export const broadcastAck = (message: string): boolean | undefined =>
{
  return message.trim() === 'Ds' ? true : undefined;
};
