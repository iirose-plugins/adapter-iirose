import type { Internal } from './base';
import type { broadcast } from '../type';
import { IIROSE_WSsend } from '../../utils/ws';
import { readJsonData, writeWJ } from '../../utils/utils';
import broadcastFunction from '../../encoder/messages/broadcast';
import noticeFunction from '../../encoder/admin/manage/notice';

const DEFAULT_BROADCAST_LIMIT = 10;
const BROADCAST_COUNT_FILE = 'wsdata/broadcastCount.json';

const getTodayDate = (): string =>
{
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const broadcastMethods = {
  broadcast(this: Internal, broadcast: broadcast)
  {
    IIROSE_WSsend(this.bot, broadcastFunction(broadcast.message, broadcast.color));
  },

  async getBroadcastRemaining(this: Internal): Promise<number>
  {
    const cache = await readJsonData(this.bot, BROADCAST_COUNT_FILE);
    const today = getTodayDate();
    if (!cache || cache.date !== today || cache.botId !== this.bot.config.uid.trim())
    {
      return DEFAULT_BROADCAST_LIMIT;
    }
    return typeof cache.remaining === 'number' && cache.remaining >= 0
      ? Math.floor(cache.remaining)
      : DEFAULT_BROADCAST_LIMIT;
  },

  async recordBroadcastAck(this: Internal): Promise<number>
  {
    const remaining = Math.max(0, await this.getBroadcastRemaining() - 1);
    await writeWJ(this.bot, BROADCAST_COUNT_FILE, {
      botId: this.bot.config.uid.trim(),
      remaining,
      date: getTodayDate(),
    });
    return remaining;
  },

  sendRoomNotice(this: Internal, notice: string)
  {
    IIROSE_WSsend(this.bot, noticeFunction(notice));
  },
};
