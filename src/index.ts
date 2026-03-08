import { Context, sleep } from 'koishi';
import { IIROSE_Bot } from './bot/bot';
import * as IIROSE from './bot/event';
import { Config } from './config';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const name = 'adapter-iirose';

export const inject = {
  required: ['http', 'logger', 'i18n'],
  optional: ['assets']
};

export const reusable = true;
export const filter = false;
export { Config };

export const usage = readFileSync(join(__dirname, "./../data/usage.html"), 'utf-8').split('\n').map(line => line.trimStart()).join('\n');

export * from './bot/bot';
export * from './utils/ws';
export * from './bot/event';

declare module 'koishi' {
  interface Events extends IIROSE.Events { }
}

export function apply(ctx: Context, config: Config)
{

  ctx.on('ready', async () =>
  {
    if (process.env.NODE_ENV === 'development' && !__dirname.includes('node_modules'))
    {
      await sleep(1 * 1000);  // 神秘步骤，可以保佑dev模式
    }
    let isDisposing = false;
    let bot: IIROSE_Bot | null = null;

    if (isDisposing)
    {
      return;
    }

    // 清理旧实例
    if (bot)
    {
      try
      {
        bot.setDisposing(true);
        // 重连标志
        if (bot.wsClient)
        {
          bot.wsClient.isReconnecting = true;
        }
        await Promise.race([
          bot.stop(),
          new Promise(resolve => ctx.setTimeout(() => resolve(undefined), 500))
        ]);
      } catch (error)
      {
        if (bot)
        {
          bot.loggerError('清理旧适配器失败:', error);
        } else
        {
          ctx.logger.error('清理旧适配器失败:', error);
        }
      }
    }

    if (isDisposing)
    {
      return;
    }

    // 创建机器人
    bot = new IIROSE_Bot(ctx, config);

    // // 启动机器人
    // 好像koishi会自动调用 bot.start();
    // await bot.start();

    ctx.on('dispose', async () =>
    {
      if (isDisposing) return;

      isDisposing = true;

      if (bot)
      {
        try
        {
          // 立即停用
          bot.setDisposing(true);
          await Promise.race([
            bot.stop(),
            new Promise(resolve => ctx.setTimeout(() => resolve(undefined), 1000))
          ]);
          bot.loggerInfo('适配器已停止运行。');
        } catch (error)
        {
          bot.loggerError('适配器停止失败:', error);
        } finally
        {
          bot = null;
        }
      }
    });
  });
}
