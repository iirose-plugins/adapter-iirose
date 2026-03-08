import { Context } from 'koishi';
import { IIROSE_Bot } from '../../bot/bot';

/**
 * 计算重试延迟时间（毫秒）
 * 第1次: 5秒, 第2次: 10秒, 第3次: 15秒...最大到配置的分钟数
 */
export function calculateRetryDelay(retryCount: number, maxRetryIntervalMinutes: number): number
{
  const baseDelay = 5000; // 5秒
  const increment = 5000; // 每次增加5秒
  const maxDelay = maxRetryIntervalMinutes * 60 * 1000; // 转换为毫秒

  const delay = baseDelay + (retryCount * increment);
  return Math.min(delay, maxDelay);
}

/**
 * 等待指定时间，支持取消
 */
export async function waitWithCancel(
  ctx: Context,
  bot: IIROSE_Bot,
  delayMs: number,
  checkDisposed: () => boolean
): Promise<boolean>
{
  let cancelled = false;

  await new Promise<void>((resolve) =>
  {
    let elapsed = 0;
    const interval = 100; // 每100ms检查一次

    const dispose = ctx.setInterval(() =>
    {
      if (checkDisposed())
      {
        dispose();
        bot.logInfo('websocket准备：插件正在停用，取消连接');
        cancelled = true;
        resolve();
        return;
      }

      elapsed += interval;
      if (elapsed >= delayMs)
      {
        dispose();
        resolve();
      }
    }, interval);
  });

  return cancelled;
}
