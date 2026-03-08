import { Universal, sleep } from 'koishi';
import * as zlib from 'node:zlib';
import { IIROSE_Bot } from '../../bot/bot';
import { decoder } from '../../decoder';
import { decoderMessage } from '../../decoder/decoderMessage';
import { LoginObj } from './types';

/**
 * 设置消息接收处理
 */
export function setupMessageHandler(
  bot: IIROSE_Bot,
  loginObj: LoginObj,
  onFirstLogin: () => void
)
{
  if (!bot.socket)
  {
    bot.loggerError('WebSocket connection is not established.');
    return;
  }

  let firstLogin = false;

  bot.socket.addEventListener('message', async (event) =>
  {
    const array = new Uint8Array(event.data);

    let message: string;
    if (array[0] === 1)
    {
      message = zlib.unzipSync(array.slice(1)).toString();
    } else
    {
      message = Buffer.from(array).toString("utf8");
    }

    if (message.length < 500)
    {
      bot.fulllogInfo(`[WS接收]`, message);
    }

    // 检查响应监听器
    for (const [prefix, handler] of bot.responseListeners.entries())
    {
      if (message.startsWith(prefix))
      {
        handler.listener(message);
        if (handler.stopPropagation)
        {
          return;
        }
      }
    }

    // 处理消息ID
    const currentUsername = bot.config.smStart ? bot.config.smUsername : bot.config.usename;
    if (message.includes(">") && message.includes(currentUsername))
    {
      const messageIdMatch = message.match(/(\d{12,})$/);
      if (messageIdMatch)
      {
        const messageId = messageIdMatch[1];
        const userPattern = new RegExp(`>${currentUsername}>`, "i");
        if (userPattern.test(message))
        {
          if (bot.messageIdResolvers.length > 0)
          {
            const resolver = bot.messageIdResolvers.shift();
            if (resolver)
            {
              resolver(messageId);
            }
          }
        }
      }
    }

    // 检查响应消息
    if (message.startsWith('+') || message.startsWith('i!'))
    {
      if (bot.handleResponse(message))
      {
        return;
      }
    }

    // 首次登录处理
    if (!firstLogin)
    {
      firstLogin = true;

      if (message.startsWith(`%*"0`))
      {
        bot.loggerError(`登录失败：名字被占用，用户名：${loginObj.n}`);
        bot.status = Universal.Status.OFFLINE;
        await bot.stop();
        await sleep(1000);
        bot.ctx.scope.dispose();
        return;
      } else if (message.startsWith(`%*"1`))
      {
        bot.loggerError("登录失败：用户名不存在");
        bot.status = Universal.Status.OFFLINE;
        await bot.stop();
        await sleep(1000);
        bot.ctx.scope.dispose();
        return;
      } else if (message.startsWith(`%*"2`))
      {
        bot.loggerError(`登录失败：密码错误，用户名：${loginObj.n}`);
        bot.status = Universal.Status.OFFLINE;
        await bot.stop();
        await sleep(1000);
        bot.ctx.scope.dispose();
        return;
      } else if (message.startsWith(`%*"4`))
      {
        bot.loggerError(`登录失败：今日可尝试登录次数达到上限，用户名：${loginObj.n}。请尝试更换网络后重新登陆。`);
        bot.status = Universal.Status.OFFLINE;
        await bot.stop();
        await sleep(1000);
        bot.ctx.scope.dispose();
        return;
      } else if (message.startsWith(`%*"5`))
      {
        bot.loggerError(`登录失败：房间密码错误，用户名：${loginObj.n}，房间id：${loginObj.r}`);
        bot.status = Universal.Status.OFFLINE;
        await bot.stop();
        await sleep(1000);
        bot.ctx.scope.dispose();
        return;
      } else if (message.startsWith(`%*"x`))
      {
        bot.loggerError(`登录失败：用户被封禁，用户名：${loginObj.n}`);
        bot.status = Universal.Status.OFFLINE;
        await bot.stop();
        await sleep(1000);
        bot.ctx.scope.dispose();
        return;
      } else if (message.startsWith(`%*"n0`))
      {
        bot.loggerError(`登录失败：房间无法进入，用户名：${loginObj.n}，房间id：${loginObj.r}`);
        bot.status = Universal.Status.OFFLINE;
        await bot.stop();
        await sleep(1000);
        bot.ctx.scope.dispose();
        return;
      } else if (message.startsWith(`%`))
      {
        bot.logInfo(loginObj);
        bot.loggerInfo(`[${bot.config.uid}] 登陆成功：欢迎回来，${loginObj.n}！`);
        bot.status = Universal.Status.ONLINE;
        bot.online();

        const session = bot.session({
          type: 'login-added',
          platform: bot.platform,
          selfId: bot.selfId,
        });
        bot.dispatch(session);
        bot.fulllogInfo('login-added', session);

        onFirstLogin();
      }
    }

    const funcObj = await decoder(bot, message);

    if (funcObj.manyMessage)
    {
      const reversedMessages = funcObj.manyMessage.slice().reverse();
      for (const element of reversedMessages)
      {
        if (!element.type)
        {
          continue;
        }
        const test: Record<string, any> = {};
        const type = element.type;

        if (type === 'memberUpdate' && element.payload)
        {
          test[type] = element.payload;
        } else
        {
          test[type] = element;
        }
        await decoderMessage(test, bot);
      }
    } else
    {
      await decoderMessage(funcObj, bot);
    }
  });
}
