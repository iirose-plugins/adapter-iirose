import { IIROSE_Bot } from '../bot';
import type { InternalType } from './types';

export class Internal
{
  bot: IIROSE_Bot;

  constructor(bot: IIROSE_Bot)
  {
    this.bot = bot;
  }

  async send(data)
  {
    if (data.hasOwnProperty('private'))
    {
      this.bot.sendMessage(`private:${data.private.userId}`, data.private.message);
    } else
    {
      this.bot.sendMessage(this.bot.config.roomId, data.public.message);
    }
  }
}

export interface Internal extends InternalType
{
}
