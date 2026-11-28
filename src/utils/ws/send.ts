import * as zlib from 'node:zlib';
import type { IIROSE_Bot, ResponseSkipReason } from '../../bot/bot';

// WebSocket发送锁，确保消息发送时序正确
type SendFailure = ResponseSkipReason | 'send-error';
let wsSendLock: Promise<SendFailure | null> = Promise.resolve(null);

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
  return (await sendFrame(bot, data)) === null;
}

export function sendFrame(bot: IIROSE_Bot, data: string): Promise<SendFailure | null>
{
  const callId = Math.random().toString(36).substring(2, 8);
  wsSendLock = wsSendLock.then(() =>
  {
    try
    {
      const reason = bot.socketSkipReason();
      if (reason)
      {
        bot.loggerWarn(`[WS发送-${callId}] 跳过发送（${reason}）`);
        return reason;
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

      return null;
    } catch (error)
    {
      bot.loggerError(`[WS发送-${callId}] 发送失败:`, error);
      return 'send-error' as const;
    }
  });

  return wsSendLock;
}
