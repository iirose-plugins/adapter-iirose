import { Fragment } from 'koishi';
import { Stock } from '../decoder/messages/system/consume/Stock';
import { IIROSE_Bot } from './bot';
export type { MailboxMessageData } from '../decoder/messages/system/mailbox/MailboxMessage';

export interface kickData
{
  username: string;
}

export interface cutOne
{
  id?: string;
}

export interface setMaxUser
{
  maxMember: number;
}

export interface whiteList
{
  username: string;
  time: string | number;
  intro?: string;
}

export interface broadcast
{
  message: string;
  color: string;
}

export interface move
{
  roomId: string;
  roomPassword?: string;
}

export interface EventsCallBackOrigin
{
  type: string;
  userId?: string;
  username?: string;
  timestamp?: number;
  author?: {
    userId: string;
    avatar: string;
    username: string;
  };
  platform: 'iirose';
  guildId?: string;
  selfId?: string;
  bot?: IIROSE_Bot;
  channelId?: string;
  send: (data: {
    public?: {
      message: Fragment;
    };
    private?: {
      message: Fragment;
      userId: string;
    };
  }) => void;
  data?: any;
}

export interface musicOrigin
{
  type: 'music' | 'video';
  name: string;
  signer: string;
  cover: string;
  link: string;
  url: string;
  duration: number;
  bitRate: number;
  color: string;
  lyrics: string;
  origin: 'netease' | 'bilibili' | 'null' | 'undefined' | null;
}

export interface StockGet
{
  (stockData: Stock): void;
}

export interface StockSession extends Stock
{
  send?: (data: {
    public?: {
      message: Fragment;
    };
    private?: {
      message: Fragment;
      userId: string;
    };
  }) => void;
  bot?: IIROSE_Bot;
}
