import { Context } from 'koishi';
import { IIROSE_Bot } from '../../bot/bot';
import { LoginObj } from './types';
import { getMd5Password, md5 } from '../password';
import { calculateRetryDelay, waitWithCancel } from './retry';
import { IIROSE_WSsend } from './send';

/**
 * 测试服务器延迟
 */
export async function getLatency(
  ctx: Context,
  bot: IIROSE_Bot,
  url: string,
  disposed: () => boolean
): Promise<number | 'error'>
{
  return new Promise((resolve) =>
  {
    if (disposed())
    {
      resolve('error');
      return;
    }

    let ws: WebSocket | null = null;
    let timeoutId: (() => void) | null = null;
    let disposingCheckId: (() => void) | null = null;
    let resolved = false;

    const cleanup = () =>
    {
      if (timeoutId)
      {
        timeoutId();
        timeoutId = null;
      }
      if (disposingCheckId)
      {
        disposingCheckId();
        disposingCheckId = null;
      }
      if (ws && (ws.readyState === 1 || ws.readyState === 0))
      {
        try
        {
          ws.close();
        } catch (e)
        {
          // 忽略关闭错误
        }
      }
      ws = null;
    };

    const safeResolve = (value: number | 'error') =>
    {
      if (!resolved)
      {
        resolved = true;
        cleanup();
        resolve(value);
      }
    };

    try
    {
      const startTime = Date.now();
      const timeout = Math.max(bot.config.timeout, 2000);

      ws = ctx.http.ws(url);

      timeoutId = ctx.setTimeout(() =>
      {
        safeResolve('error');
      }, timeout);

      disposingCheckId = ctx.setInterval(() =>
      {
        if (disposed())
        {
          safeResolve('error');
        }
      }, 200);

      ws.addEventListener('open', () =>
      {
        const endTime = Date.now();
        const latency = endTime - startTime;
        safeResolve(latency);
      });

      ws.addEventListener('error', () =>
      {
        safeResolve('error');
      });

      ws.addEventListener('close', () =>
      {
        if (!resolved)
        {
          safeResolve('error');
        }
      });

    } catch (error)
    {
      safeResolve('error');
    }
  });
}

/**
 * 准备 WebSocket 连接，测试服务器并选择最快的
 */
export async function prepareConnection(
  ctx: Context,
  bot: IIROSE_Bot,
  disposed: () => boolean
): Promise<WebSocket>
{
  const iiroseList = ['m1', 'm2', 'm8', 'm9', 'm'];
  let fastest = 'www';
  let maximumSpeed = 100000;

  let allErrors: boolean;
  let retryCount = 0;
  const maxRetryIntervalMinutes = bot.config.maxRetryInterval;

  do
  {
    if (disposed())
    {
      throw new Error('插件正在停用');
    }

    allErrors = true;
    const speedTests: Promise<{ index: string, speed: number | 'error'; }>[] = [];

    // 并行测试所有服务器
    for (let webIndex of iiroseList)
    {
      speedTests.push(
        getLatency(ctx, bot, `wss://${webIndex}.iirose.com:8778`, disposed)
          .then(speed => ({ index: webIndex, speed }))
          .catch(() => ({ index: webIndex, speed: 'error' as const }))
      );
    }

    try
    {
      const results = await Promise.race([
        Promise.allSettled(speedTests).then(settledResults =>
          settledResults.map(result =>
            result.status === 'fulfilled' ? result.value : { index: '', speed: 'error' as const }
          ).filter(r => r.index !== '')
        ),
        new Promise<{ index: string, speed: 'error'; }[]>(resolve =>
          ctx.setTimeout(() => resolve(iiroseList.map(index => ({ index, speed: 'error' as const }))), 5000)
        )
      ]);

      if (disposed())
      {
        throw new Error('插件正在停用');
      }

      // 找到最快的可用服务器
      for (const result of results)
      {
        if (result.speed !== 'error')
        {
          allErrors = false;
          if (maximumSpeed > result.speed)
          {
            fastest = result.index;
            maximumSpeed = result.speed;
          }
        }
      }

      if (!allErrors)
      {
        break;
      }

    } catch (error)
    {
      bot.loggerWarn('服务器测试过程中出现错误:', error);
    }

    if (allErrors)
    {
      const delayMs = calculateRetryDelay(retryCount, maxRetryIntervalMinutes);
      const delaySec = Math.round(delayMs / 1000);

      if (!bot.config.silentRetry)
      {
        bot.loggerWarn(`所有服务器都无法连接，将在${delaySec}秒后重试...`);
      }

      const cancelled = await waitWithCancel(ctx, bot, delayMs, disposed);

      if (cancelled)
      {
        throw new Error('插件正在停用');
      }

      retryCount++;

      if (disposed())
      {
        throw new Error('插件正在停用');
      }
    }

  } while (allErrors && !disposed());

  if (!fastest)
  {
    fastest = 'www';
  }

  const targetUrl = `wss://${fastest}.iirose.com:8778`;
  bot.loggerInfo(`找到可用服务器: ${targetUrl}, 延迟: ${maximumSpeed}ms`);

  const socket = ctx.http.ws(targetUrl);
  socket.binaryType = 'arraybuffer';

  const dispose = ctx.on('dispose', () =>
  {
    if (socket && socket.readyState === 1)
    {
      socket.close();
    }
    dispose();
  });

  return socket;
}

/**
 * 创建登录对象
 */
export function createLoginObj(bot: IIROSE_Bot): LoginObj
{
  const roomIdReg = /\s*\[_([\\s\\S]+)_\]\s*/;
  const userNameReg = /\s*\[\\*([\\s\\S]+)\\*\]\s*/;

  const roomIdConfig = bot.config.roomId;
  const userNameConfig = bot.config.usename;
  let username = (userNameReg.test(userNameConfig)) ? userNameConfig.match(userNameReg)?.[1] : userNameConfig;
  let room = (roomIdReg.test(roomIdConfig)) ? roomIdConfig.match(roomIdReg)?.[1] : roomIdConfig;

  let loginObj: LoginObj;

  if (bot.config.smStart && bot.config.smPassword === 'ec3a4ac482b483ac02d26e440aa0a948')
  {
    loginObj = {
      r: bot.config.smRoom,
      n: bot.config.smUsername,
      i: bot.config.smImage,
      nc: bot.config.smColor,
      s: bot.config.smGender,
      st: bot.config.smst,
      mo: bot.config.smmo,
      uid: bot.config.smUid,
      li: bot.config.smli,
      mb: bot.config.smmb,
      mu: bot.config.smmu,
      la: bot.config.smLocation,
      vc: bot.config.smvc,
      fp: `@${md5(bot.config.smUsername)}`
    };

    bot.loggerInfo('已启用蔷薇游客模式');
  } else
  {
    const hashedPassword = getMd5Password(bot.config.password);
    if (!hashedPassword)
    {
      bot.loggerError('登录失败：密码不能为空');
      throw new Error('密码不能为空');
    }

    loginObj = {
      r: room || bot.config.roomId,
      n: username || bot.config.usename,
      p: hashedPassword,
      st: bot.config.botStatus,
      mo: bot.config.signature,
      mb: '',
      mu: '01',
      lr: bot.config.oldRoomId,
      rp: bot.config.roomPassword,
      fp: `@${md5(username || bot.config.usename)}`
    };
  }

  if (!loginObj.lr)
  {
    delete loginObj.lr;
  }

  return loginObj;
}

/**
 * 设置连接打开事件
 */
export function setupOpenEvent(
  socket: WebSocket,
  bot: IIROSE_Bot,
  loginObj: LoginObj,
  startHeartbeat: () => void,
  startEvents: () => (() => boolean)[]
)
{
  socket.addEventListener('open', async () =>
  {
    bot.loggerInfo('正在登录中...');

    try
    {
      const loginPack = '*' + JSON.stringify(loginObj);
      await IIROSE_WSsend(bot, loginPack);

      const events = startEvents();

      if (bot.config.keepAliveEnable)
      {
        startHeartbeat();
      }

      return events;
    } catch (error)
    {
      bot.loggerError('登录包发送失败:', error);
      if (socket.readyState === 1)
      {
        socket.close();
      }
      throw error;
    }
  });
}
