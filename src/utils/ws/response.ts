import type { IIROSE_Bot, ResponseWaiter } from '../../bot/bot';
import { IIROSE_WSsend } from './send';

/**
 * 发送 WebSocket 报文并等待多个可能的前缀回执（任一回执即完成）。
 * 使用 bot 的前缀队列，因此不会挤掉同前缀的其它等待者。
 * @param bot bot实例
 * @param payload 要发送的报文
 * @param prefixes 可能出现的回执前缀
 * @param timeout 超时时间 (毫秒)
 * @returns 命中的回执字符串，超时或无法发送返回 null
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
    let settled = false;

    const waiter: ResponseWaiter = {
      stopPropagation: true,
      listener: (data: string) => finish(data),
    };

    const cleanup = () =>
    {
      prefixes.forEach(prefix => bot.removeResponseWaiter(prefix, waiter));
    };

    const finish = (data: string | null) =>
    {
      if (settled) return;
      settled = true;
      dispose();
      cleanup();
      resolve(data);
    };

    const dispose = bot.ctx.setTimeout(() => finish(null), effectiveTimeout);

    prefixes.forEach(prefix => bot.addResponseWaiter(prefix, waiter));

    void IIROSE_WSsend(bot, payload).then((sent) =>
    {
      if (sent || settled) return;
      finish(null);
    });
  });
}
