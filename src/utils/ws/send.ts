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

export async function IIROSE_WSsend(bot: IIROSE_Bot, data: string): Promise<void>
{
  const callId = Math.random().toString(36).substring(2, 8);

  wsSendLock = wsSendLock.then(async () =>
  {
    try
    {
      if (!bot.socket)
      {
        bot.loggerError('布豪！ !bot.socket !!! 请联系开发者');
        return;
      }

      if (bot.socket.readyState === 0)
      {
        bot.loggerError('布豪！ bot.socket.readyState == 0 !!! 请联系开发者');
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
    } catch (error)
    {
      bot.loggerError(`[WS发送-${callId}] 发送失败:`, error);
    }
  });

  await wsSendLock;
}
