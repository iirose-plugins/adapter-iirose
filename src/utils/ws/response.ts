import type { IIROSE_Bot } from '../../bot/bot';
import { IIROSE_WSsend } from './send';

/**
 * 发送 WebSocket 报文并等待多个可能的前缀回执。
 * @param bot bot实例
 * @param payload 要发送的报文
 * @param prefixes 可能出现的回执前缀
 * @param timeout 超时时间 (毫秒)
 * @returns 命中的回执字符串，超时返回 null
 */
export async function sendAndWaitForResponsePrefixes(
  bot: IIROSE_Bot,
  payload: string,
  prefixes: string[],
  timeout?: number,
): Promise<string | null>
{
  const effectiveTimeout = timeout ?? bot.config.timeout;

  return new Promise((resolve) =>
  {
    const dispose = bot.ctx.setTimeout(() =>
    {
      prefixes.forEach(prefix => bot.responseListeners.delete(prefix));
      resolve(null);
    }, effectiveTimeout);

    const listener = (data: string) =>
    {
      dispose();
      prefixes.forEach(prefix => bot.responseListeners.delete(prefix));
      resolve(data);
    };

    prefixes.forEach(prefix => bot.responseListeners.set(prefix, { listener, stopPropagation: true }));
    IIROSE_WSsend(bot, payload);
  });
}
