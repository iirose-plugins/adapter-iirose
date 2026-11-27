import * as zlib from 'node:zlib';
import { IIROSE_Bot } from '../../bot/bot';

// WebSocket发送锁，确保消息发送时序正确
let wsSendLock: Promise<void> = Promise.resolve();

function toArrayBuffer(data: Uint8Array): ArrayBuffer
{
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  const view = new Uint8Array(arrayBuffer);
  view.set(data);
  return arrayBuffer;
}

/**
 * 发送一帧到 WebSocket。
 * @returns 是否真的发出去了；socket 不存在 / 连接中 / 已关闭时返回 false（不抛错，但会写日志）
 */
export async function IIROSE_WSsend(bot: IIROSE_Bot, data: string): Promise<boolean>
{
  const callId = Math.random().toString(36).substring(2, 8);

  let sent = false;

  wsSendLock = wsSendLock.then(async () =>
  {
    try
    {
      if (!bot.socket)
      {
        bot.loggerWarn('布豪！ !bot.socket !!! 请联系开发者');
        return;
      }

      if (bot.socket.readyState === 0)
      {
        bot.logInfo('WebSocket 连接中，跳过本次发送');
        return;
      }

      if (bot.socket.readyState > 1)
      {
        bot.loggerWarn(`WebSocket 已关闭(readyState=${bot.socket.readyState})，跳过本次发送`);
        return;
      }

      const shortData = data.length > 50 ? data.substring(0, 50) + '...' : data;
      if (shortData.trim().length > 0)
      {
        bot.fulllogInfo(`[WS发送-${callId}] 发送数据: ${shortData}`);
      }

      const buffer = Buffer.from(data);
      const uintArray = Uint8Array.from(buffer);

      if (uintArray.length > 256)
      {
        const deflatedData = zlib.gzipSync(data);
        const deflatedArray = new Uint8Array(deflatedData.length + 1);
        deflatedArray[0] = 1;
        deflatedArray.set(deflatedData, 1);
        bot.socket.send(toArrayBuffer(deflatedArray));
      } else
      {
        bot.socket.send(toArrayBuffer(uintArray));
      }

      sent = true;
    } catch (error)
    {
      bot.loggerError(`[WS发送-${callId}] 发送失败:`, error);
    }
  });

  await wsSendLock;
  return sent;
}
