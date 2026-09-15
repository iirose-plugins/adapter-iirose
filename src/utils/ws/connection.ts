import { Context } from 'koishi';
import { IIROSE_Bot } from '../../bot/bot';
import { stripMarkup } from '../../config';
import { LoginObj } from './types';
import { getMd5Password, md5 } from '../password';
import { calculateRetryDelay, waitWithCancel } from './retry';
import { IIROSE_WSsend } from './send';

// 与当前网页客户端保持一致，WebSocket 通过 Cloudflare 的 443 端口连接
const IIROSE_WEBSOCKET_HOSTS = ['m1', 'm8', 'm9'];
const IIROSE_WEBSOCKET_PORT = 443;

function isDisposingError(error: unknown): boolean
{
  return error instanceof Error && error.message.includes('插件正在停用');
}

/**
 * 返回首个连接成功的节点，全部失败时返回 null
 */
async function getFastestServer(
  speedTests: Promise<{ index: string, speed: number | 'error'; }>[]
): Promise<{ index: string, speed: number; } | null>
{
  return new Promise((resolve) =>
  {
    let pending = speedTests.length;

    if (pending === 0)
    {
      resolve(null);
      return;
    }

    for (const speedTest of speedTests)
    {
      speedTest.then((result) =>
      {
        if (result.speed !== 'error')
        {
          resolve({ index: result.index, speed: result.speed });
          return;
        }

        if (--pending === 0)
        {
          resolve(null);
        }
      }, () =>
      {
        if (--pending === 0)
        {
          resolve(null);
        }
      });
    }
  });
}

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

    } catch
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
  let fastest = IIROSE_WEBSOCKET_HOSTS[0];
  let maximumSpeed = Number.POSITIVE_INFINITY;

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
    for (const webIndex of IIROSE_WEBSOCKET_HOSTS)
    {
      const url = `wss://${webIndex}.iirose.com:${IIROSE_WEBSOCKET_PORT}`;
      speedTests.push(
        getLatency(ctx, bot, url, disposed)
          .then(speed =>
          {
            if (bot.config.debugMode)
            {
              bot.logInfo(`WebSocket 节点 ${webIndex}: ${speed === 'error' ? '连接失败' : `${speed}ms`}`);
            }
            return { index: webIndex, speed };
          })
          .catch(() => ({ index: webIndex, speed: 'error' as const }))
      );
    }

    try
    {
      // 首个成功打开的节点即为当前最快节点
      const fastestResult = await getFastestServer(speedTests);

      if (disposed())
      {
        throw new Error('插件正在停用');
      }

      if (fastestResult)
      {
        allErrors = false;
        fastest = fastestResult.index;
        maximumSpeed = fastestResult.speed;
      }

      if (!allErrors)
      {
        break;
      }

    } catch (error)
    {
      if (disposed() || isDisposingError(error))
      {
        throw error;
      }

      bot.loggerWarn('服务器测试过程中出现错误:', error);
    }

    if (allErrors)
    {
      const delayMs = calculateRetryDelay(retryCount, maxRetryIntervalMinutes);
      const delaySec = Math.round(delayMs / 1000);

      if (!bot.config.silentRetry || bot.config.debugMode)
      {
        bot.loggerWarn(`所有服务器都无法连接，将在${delaySec}秒后重试... (重试次数: ${retryCount})`);
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

  const targetUrl = `wss://${fastest}.iirose.com:${IIROSE_WEBSOCKET_PORT}`;
  bot.loggerInfo(`找到可用服务器: ${targetUrl}, 延迟: ${maximumSpeed}ms`);

  const socket = ctx.http.ws(targetUrl);
  socket.binaryType = 'arraybuffer';

  return socket;
}

/**
 * 创建登录对象
 */
export function createLoginObj(bot: IIROSE_Bot): LoginObj
{
  const roomIdConfig = stripMarkup(bot.config.roomId, '[_', '_]');
  const userNameConfig = stripMarkup(bot.config.usename, '[*', '*]');
  const username = userNameConfig;
  const room = roomIdConfig;

  let loginObj: LoginObj;

  if (bot.config.smStart && bot.config.smPassword === 'ec3a4ac482b483ac02d26e440aa0a948')
  {
    loginObj = {
      r: bot.config.smRoom?.trim(),
      n: bot.config.smUsername?.trim(),
      i: bot.config.smImage?.trim(),
      nc: bot.config.smColor?.trim(),
      s: bot.config.smGender?.trim(),
      st: bot.config.smst?.trim(),
      mo: bot.config.smmo?.trim(),
      uid: bot.config.smUid?.trim(),
      li: bot.config.smli?.trim(),
      mb: bot.config.smmb?.trim(),
      mu: bot.config.smmu?.trim(),
      la: bot.config.smLocation?.trim(),
      vc: bot.config.smvc?.trim(),
      fp: `@${md5(bot.config.smUsername?.trim() || '')}`
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
      r: room || roomIdConfig,
      n: username || userNameConfig,
      p: hashedPassword,
      st: bot.config.botStatus,
      mo: bot.config.signature,
      mb: '',
      mu: '01',
      lr: bot.config.oldRoomId,
      rp: bot.config.roomPassword,
      fp: `@${md5(username || userNameConfig)}`
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
