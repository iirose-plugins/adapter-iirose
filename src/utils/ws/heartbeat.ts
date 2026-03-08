import { Context, Universal } from 'koishi';
import { IIROSE_Bot } from '../../bot/bot';
import { IIROSE_WSsend } from './send';

/**
 * 启动心跳保活机制
 */
export function startHeartbeat(
  ctx: Context,
  bot: IIROSE_Bot,
  disposed: () => boolean,
  onConnectionLoss: () => void
): () => void
{
  const dispose = ctx.setInterval(async () =>
  {
    if (disposed())
    {
      return;
    }

    if (bot.socket)
    {
      if (bot.socket.readyState === 1)
      {
        if (bot.status == Universal.Status.ONLINE)
        {
          try
          {
            await IIROSE_WSsend(bot, '');
          } catch (error)
          {
            bot.loggerWarn('心跳包发送失败:', error);
          }
        }
      } else if (bot.socket.readyState === 3 || bot.socket.readyState === 2)
      {
        bot.loggerWarn(`心跳保活检测到连接异常 实例: ${bot.user?.id}, readyState: ${bot.socket.readyState}`);
        onConnectionLoss();
      }
    } else
    {
      bot.loggerWarn(`心跳保活检测到socket为空 实例: ${bot.user?.id}`);
      onConnectionLoss();
    }
  }, 30 * 1000);

  return dispose;
}
