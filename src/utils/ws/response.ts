import type { IIROSE_Bot, ResponseSkipReason, ResponseWaiter } from '../../bot/bot';
import { sendFrame } from './send';

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
  const result = await waitForResponse(bot, payload, prefixes, { timeout });
  return result.data;
}

interface ResponseOptions
{
  stopPropagation?: boolean;
  timeout?: number;
  matches?: (message: string) => boolean;
}

interface ResponseResult
{
  data: string | null;
  reason?: ResponseSkipReason | 'send-error' | 'timeout';
}

export function waitForResponse(
  bot: IIROSE_Bot, payload: string, prefixes: string[], options: ResponseOptions,
): Promise<ResponseResult>
{
  const reason = bot.socketSkipReason();
  if (reason)
  {
    bot.loggerWarn(`[WS发送] 跳过发送（${reason}）`);
    return Promise.resolve({ data: null, reason });
  }

  return new Promise((resolve) =>
  {
    let settled = false;

    const waiter: ResponseWaiter = {
      stopPropagation: options.stopPropagation ?? true,
      matches: options.matches,
      listener: (data: string) => finish({ data }),
    };

    const finish = (result: ResponseResult) =>
    {
      if (settled) return;
      settled = true;
      dispose();
      prefixes.forEach(prefix => bot.removeResponseWaiter(prefix, waiter));
      resolve(result);
    };

    const dispose = bot.ctx.setTimeout(() => finish({ data: null, reason: 'timeout' }), options.timeout ?? bot.config.timeout);

    prefixes.forEach(prefix => bot.addResponseWaiter(prefix, waiter));

    void sendFrame(bot, payload).then((failure) =>
    {
      if (failure) finish({ data: null, reason: failure });
    });
  });
}
