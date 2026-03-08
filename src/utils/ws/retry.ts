import { Context } from 'koishi';
import { IIROSE_Bot } from '../../bot/bot';

/**
 * 重试延迟算法
 */
export function calculateRetryDelay(retryCount: number, maxRetryIntervalMinutes: number): number
{
  const maxDelay = maxRetryIntervalMinutes * 60 * 1000;

  if (retryCount < 3)
  {
    return 5 * 1000; // 5秒
  }

  if (retryCount < 6)
  {
    return Math.min(30 * 1000, maxDelay); // 30秒
  }

  if (retryCount < 9)
  {
    return Math.min(3 * 60 * 1000, maxDelay); // 3分钟
  }

  // 第10次起：使用配置的最大重试间隔
  return maxDelay;
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
